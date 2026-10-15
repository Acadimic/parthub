"""Checks short Sanskrit clips with a phoneme recogniser and regenerates the ones heard wrongly.

Indic Parler-TTS often garbles a bare letter or a one-syllable word (अ, च, ऋ said as a ramble, or
with an extra syllable). This reads JSON lines {"key", "text", "target"} from stdin, where target is
the clip's expected sounds in a coarse phoneme alphabet (verify-short.mjs makes it from the IAST),
hears <cache>/<key>.mp3 with wav2vec2-lv-60-espeak-cv-ft, and when what it hears is not the target,
tries new takes (seeds 0–15, the text alone and with a daṇḍa) until one is heard right. With --apply
the winning take replaces the cached file; the old file is kept in a dated sa-replaced-* folder.
"""

import argparse
import datetime
import itertools
import json
import re
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
from speak import MODEL, to_mp3  # noqa: E402

VOICE = "Aryan speaks at a slow, clear pace with a calm, neutral tone. The recording is of very high quality, with the speaker's voice sounding clear and very close up."
RECOGNISER = "facebook/wav2vec2-lv-60-espeak-cv-ft"

# Recogniser IPA → the coarse alphabet: vowel length and aspiration are not judged (the recogniser
# is unreliable on both); garbled, missing or extra sounds are.
SUBS = [("eɪ", "e"), ("oʊ", "o"), ("əʊ", "o"), ("tɕh", "c"), ("tʃh", "c"), ("dʒh", "dʒ"), ("dʑ", "dʒ"), ("tɕ", "c"), ("tʃ", "c"), ("ɑu", "a u"), ("ɑ", "a"), ("ʌ", "a"), ("ə", "a"),
        ("ɐ", "a"), ("æ", "a"), ("ɪ", "i"), ("ʊ", "u"), ("ʉ", "u"), ("ɛ", "e"), ("ɔ", "o"), ("ɾ", "r"), ("ɹ", "r"), ("ʋ", "v"), ("w", "v"),
        ("ɡ", "g"), ("ʈ", "t"), ("ɖ", "d"), ("ɳ", "n"), ("ɕ", "ʃ"), ("ʂ", "ʃ"), ("ɦ", "h"), ("x", "h"), ("ʱ", ""), ("ʰ", ""), ("ː", ""), ("ʔ", ""), ("ei", "e"), ("ou", "o"), ("uo", "o")]
STOPS = {"k", "g", "c", "dʒ", "t", "d", "p", "b"}
ALTS = {"G": ["g", "k"], "J": ["dʒ", "c"], "D": ["d", "t"], "B": ["b", "p"], "Ŋ": ["ŋ", "n", "ŋ g"], "Ɲ": ["ɲ", "n", "n j"], "AI": ["a i", "a j i", "a j"],
        "R": ["r i", "r u", "r"], "L": ["l i", "l"], "N": ["m", "n", "ŋ"], "H": ["", "h", "h a", "h i", "h u", "h e", "h o"]}


def heard_coarse(ipa: str) -> str:
    s = re.sub(r"\d", "", ipa)
    for a, b in SUBS:
        s = s.replace(a, b)
    out = []
    for token in s.split():
        if len(token) > 1 and token.endswith("h") and token[:-1] in STOPS:
            token = token[:-1]
        if token == "h" and out and out[-1] in STOPS:
            continue
        out.append(token)
    return " ".join(out)


def targets(target: str) -> set[str]:
    choices = [ALTS.get(t, [t]) for t in target.split()]
    return {" ".join(" ".join(c).split()) for c in itertools.product(*choices)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    cache = Path(args.cache)
    backup = cache.parent / f"sa-replaced-{datetime.date.today().isoformat()}"
    items = [json.loads(line) for line in sys.stdin if line.strip()]
    # Clips tuned by hand or by pairs.py (vowel length) are kept as they are: this check cannot hear
    # length, and re-hearing an encoded file can disagree with the take it chose.
    locked_file = cache / "locked.json"
    locked = set(json.loads(locked_file.read_text())) if locked_file.exists() else set()
    items = [item for item in items if item["key"] not in locked]
    print(f"{len(items)} short clip(s) to hear", file=sys.stderr, flush=True)

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    fe = Wav2Vec2FeatureExtractor.from_pretrained(RECOGNISER)
    rtok = Wav2Vec2PhonemeCTCTokenizer.from_pretrained(RECOGNISER, do_phonemize=False)
    rec = Wav2Vec2ForCTC.from_pretrained(RECOGNISER).eval()
    tts = None

    def hear(samples: np.ndarray, rate: int) -> str:
        y = AF.resample(torch.from_numpy(samples.astype(np.float32)), rate, 16000).numpy()
        with torch.no_grad():
            ids = torch.argmax(rec(fe(y, sampling_rate=16000, return_tensors="pt").input_values).logits, dim=-1)
        return heard_coarse(rtok.batch_decode(ids)[0])

    def load(path: Path) -> np.ndarray:
        with tempfile.TemporaryDirectory() as d:
            wav = Path(d) / "a.wav"
            subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16@16000", "-c", "1", str(path), str(wav)], check=True)
            samples, _ = sf.read(wav)
        return samples

    report = []
    for index, item in enumerate(items, 1):
        want = targets(item["target"])
        path = cache / f"{item['key']}.mp3"
        heard = hear(load(path), 16000) if path.exists() else ""
        if heard in want:
            report.append({**item, "status": "ok", "heard": heard})
            continue
        if tts is None:
            tts = ParlerTTSForConditionalGeneration.from_pretrained(MODEL).to(device)
            tok = AutoTokenizer.from_pretrained(MODEL)
            dtok = AutoTokenizer.from_pretrained(tts.config.text_encoder._name_or_path)
            rate = tts.config.sampling_rate
            desc = dtok(VOICE, return_tensors="pt").to(device)
        letters = len(re.sub(r"[।॥!?,.\s]", "", item["text"]))
        longest = max(1.2, letters * 0.35) + 0.4
        found = None
        base = item["text"].rstrip("।॥!?,. ")
        for seed in range(16):
            for text in (base, base + "।"):
                torch.manual_seed(seed)
                prompt = tok(text, return_tensors="pt").to(device)
                generation = tts.generate(input_ids=desc.input_ids, attention_mask=desc.attention_mask, prompt_input_ids=prompt.input_ids, prompt_attention_mask=prompt.attention_mask)
                samples = np.atleast_1d(generation.cpu().numpy().squeeze()).astype(np.float32)
                if len(samples) < rate * 0.2:
                    continue
                frame = int(rate * 0.05)
                energy = np.array([np.abs(samples[i : i + frame]).mean() for i in range(0, len(samples), frame)])
                on = np.where(energy > energy.max() * 0.1)[0]
                samples = samples[max(0, on[0] * frame - int(rate * 0.1)) : min(len(samples), (on[-1] + 1) * frame + int(rate * 0.15))]
                if not (0.25 <= len(samples) / rate <= longest):
                    continue
                if hear(samples, rate) in want:
                    found = (samples, text, seed)
                    break
            if found:
                break
        if not found and letters <= 2:
            # A bare letter the model will not say alone often comes out right inside a short
            # recitation ("ऋ, ऋ, ऋ"); each separate run of the take is heard on its own.
            for seed in range(12):
                for text in (f"{base}, {base}, {base}", f"{base}। {base}। {base}।"):
                    torch.manual_seed(seed)
                    prompt = tok(text, return_tensors="pt").to(device)
                    generation = tts.generate(input_ids=desc.input_ids, attention_mask=desc.attention_mask, prompt_input_ids=prompt.input_ids, prompt_attention_mask=prompt.attention_mask)
                    samples = np.atleast_1d(generation.cpu().numpy().squeeze()).astype(np.float32)
                    if len(samples) < rate * 0.5:
                        continue
                    frame = int(rate * 0.05)
                    energy = np.array([np.abs(samples[i : i + frame]).mean() for i in range(0, len(samples), frame)])
                    voiced = energy > energy.max() * 0.1
                    runs, start = [], None
                    for i, v in enumerate(voiced):
                        if v and start is None:
                            start = i
                        if not v and start is not None:
                            runs.append((start, i)); start = None
                    if start is not None:
                        runs.append((start, len(voiced)))
                    # merge runs split by a gap under 150 ms (a stop closure inside one syllable)
                    merged = []
                    for r in runs:
                        if merged and r[0] - merged[-1][1] < 3:
                            merged[-1] = (merged[-1][0], r[1])
                        else:
                            merged.append(r)
                    for a, b in merged:
                        piece = samples[max(0, a * frame - int(rate * 0.08)) : min(len(samples), b * frame + int(rate * 0.12))]
                        if 0.25 <= len(piece) / rate <= longest and hear(piece, rate) in want:
                            found = (piece, text, seed)
                            break
                    if found:
                        break
                if found:
                    break
        if not found:
            report.append({**item, "status": "unresolved", "heard": heard})
            print(f"{index}/{len(items)} {item['text']} unresolved (heard {heard!r})", file=sys.stderr, flush=True)
            continue
        if args.apply:
            backup.mkdir(exist_ok=True)
            if path.exists():
                shutil.copy2(path, backup / path.name)
            path.write_bytes(to_mp3(found[0], rate))
        report.append({**item, "status": "replaced", "heard": heard, "with": f"{found[1]} seed {found[2]}"})
        print(f"{index}/{len(items)} {item['text']} replaced (was {heard!r})", file=sys.stderr, flush=True)
    Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
