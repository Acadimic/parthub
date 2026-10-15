"""Makes short/long vowel pairs sound short and long: इ / ई, कि / की, ऋ / ॠ.

Indic Parler-TTS does not keep vowel length on a bare letter or syllable (ई came out shorter than इ),
and the phoneme recogniser in fixshort.py cannot judge length. This measures it instead: for each
pair it gathers takes of both texts (the stored ones first, then new seeds), keeps the takes the
recogniser hears as the right sounds, and picks a short take of normal length and a long take whose
voiced part lasts 1.8–2.6 times as long. With --apply both files are written over the given keys
(old files kept in a dated sa-replaced-* folder).

stdin: JSON lines {"short": {"text", "keys": [...]}, "long": {"text", "keys": [...]}, "target": "<coarse>"}
"""

import argparse
import datetime
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
import torchaudio.functional as AF
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer, Wav2Vec2FeatureExtractor, Wav2Vec2ForCTC, Wav2Vec2PhonemeCTCTokenizer

sys.path.insert(0, str(Path(__file__).parent))
from fixshort import RECOGNISER, VOICE, heard_coarse, targets  # noqa: E402
from speak import MODEL, to_mp3  # noqa: E402

RATE = 16000


def voiced_seconds(x: np.ndarray, rate: int) -> float:
    frame = int(rate * 0.02)
    energy = np.array([np.abs(x[i : i + frame]).mean() for i in range(0, len(x), frame)])
    return float((energy > energy.max() * 0.15).sum() * 0.02)


def trim(x: np.ndarray, rate: int) -> np.ndarray:
    frame = int(rate * 0.02)
    energy = np.array([np.abs(x[i : i + frame]).mean() for i in range(0, len(x), frame)])
    on = np.where(energy > energy.max() * 0.1)[0]
    return x if not len(on) else x[max(0, on[0] * frame - int(rate * 0.1)) : min(len(x), (on[-1] + 1) * frame + int(rate * 0.15))]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    cache = Path(args.cache)
    backup = cache.parent / f"sa-replaced-{datetime.date.today().isoformat()}"
    pairs = [json.loads(line) for line in sys.stdin if line.strip()]

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    fe = Wav2Vec2FeatureExtractor.from_pretrained(RECOGNISER)
    rtok = Wav2Vec2PhonemeCTCTokenizer.from_pretrained(RECOGNISER, do_phonemize=False)
    rec = Wav2Vec2ForCTC.from_pretrained(RECOGNISER).eval()
    tts = ParlerTTSForConditionalGeneration.from_pretrained(MODEL).to(device)
    tok = AutoTokenizer.from_pretrained(MODEL)
    dtok = AutoTokenizer.from_pretrained(tts.config.text_encoder._name_or_path)
    rate = tts.config.sampling_rate
    desc = dtok(VOICE, return_tensors="pt").to(device)

    def hear(x: np.ndarray, r: int) -> str:
        y = AF.resample(torch.from_numpy(x.astype(np.float32)), r, RATE).numpy()
        with torch.no_grad():
            ids = torch.argmax(rec(fe(y, sampling_rate=RATE, return_tensors="pt").input_values).logits, dim=-1)
        return heard_coarse(rtok.batch_decode(ids)[0])

    def load(path: Path) -> np.ndarray:
        with tempfile.TemporaryDirectory() as d:
            wav = Path(d) / "a.wav"
            subprocess.run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{rate}", "-c", "1", str(path), str(wav)], check=True)
            x, _ = sf.read(wav)
        return x.astype(np.float32)

    def takes(text: str, keys: list[str], want: set[str], seeds: range):
        """(samples, voiced seconds, source) for every take heard right: stored files, then new seeds."""
        out = []
        for key in keys:
            path = cache / f"{key}.mp3"
            if path.exists():
                x = load(path)
                if hear(x, rate) in want:
                    out.append((x, voiced_seconds(x, rate), f"stored {key[:8]}"))
        base = text.rstrip("।")
        for seed in seeds:
            for t in (base, base + "।"):
                torch.manual_seed(seed)
                p = tok(t, return_tensors="pt").to(device)
                g = tts.generate(input_ids=desc.input_ids, attention_mask=desc.attention_mask, prompt_input_ids=p.input_ids, prompt_attention_mask=p.attention_mask)
                x = np.atleast_1d(g.cpu().numpy().squeeze()).astype(np.float32)
                if len(x) < rate * 0.2:
                    continue
                x = trim(x, rate)
                if len(x) / rate > 1.6:
                    continue
                if hear(x, rate) in want:
                    out.append((x, voiced_seconds(x, rate), f"{t} seed {seed}"))
        return out

    for pair in pairs:
        want = targets(pair["target"])
        shorts = takes(pair["short"]["text"], pair["short"]["keys"], want, range(10))
        longs = takes(pair["long"]["text"], pair["long"]["keys"], want, range(14))
        best = None
        for s in shorts:
            if not 0.12 <= s[1] <= 0.45:
                continue
            for lg in longs:
                ratio = lg[1] / s[1]
                if 1.8 <= ratio <= 2.6:
                    score = abs(ratio - 2.1) + abs(s[1] - 0.25)
                    if best is None or score < best[0]:
                        best = (score, s, lg, ratio)
        label = f"{pair['short']['text']} / {pair['long']['text']}"
        if not best:
            print(f"{label}: no pair found (short takes {[round(s[1], 2) for s in shorts]}, long {[round(lg[1], 2) for lg in longs]})", flush=True)
            continue
        _, s, lg, ratio = best
        print(f"{label}: short {s[1]:.2f}s ({s[2]}), long {lg[1]:.2f}s ({lg[2]}), ratio {ratio:.2f}", flush=True)
        if args.apply:
            backup.mkdir(exist_ok=True)
            for side, chosen in (("short", s), ("long", lg)):
                for key in pair[side]["keys"]:
                    path = cache / f"{key}.mp3"
                    if path.exists() and not (backup / path.name).exists():
                        shutil.copy2(path, backup / path.name)
                    path.write_bytes(to_mp3(chosen[0], rate))


if __name__ == "__main__":
    main()
