"""Synthesises speech for the course agent's `course:audio` step.

Reads JSON lines from stdin, one item each: {"key": "<sha256>", "text": "...", "description": "..."}
— or "segments": ["line", …] in place of "text" for a passage or dialogue, spoken line by line and
joined with a short pause — and writes <out>/<key>.mp3 (mono, 64 kbps) for every item whose file is
not there yet. The model loads once per run, so a batch of hundreds of items costs one load.

    python speak.py --out .course-agent/audio/sa < items.jsonl

Engine: Indic Parler-TTS (AI4Bharat, Apache 2.0), the free model with real Sanskrit support. The
description sentence chooses the voice and delivery; the generator keeps it fixed per language so
every item in a course sounds like the same speaker.
"""

import argparse
import json
import sys
from pathlib import Path

import lameenc
import numpy as np
import torch
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer

MODEL = "ai4bharat/indic-parler-tts"


def to_mp3(samples: np.ndarray, rate: int) -> bytes:
    pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16)
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(64)
    encoder.set_in_sample_rate(rate)
    encoder.set_channels(1)
    encoder.set_quality(2)
    return encoder.encode(pcm.tobytes()) + encoder.flush()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    items = [json.loads(line) for line in sys.stdin if line.strip()]
    todo = [item for item in items if not (out / f"{item['key']}.mp3").exists()]
    print(f"{len(items)} item(s), {len(todo)} to synthesise", file=sys.stderr, flush=True)
    if not todo:
        return

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL).to(device)
    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
    rate = model.config.sampling_rate

    def speak(text: str, voice: str, seed: int) -> np.ndarray:
        # A fixed seed, so a re-run of unchanged text gives the same voice.
        torch.manual_seed(seed)
        description = description_tokenizer(voice, return_tensors="pt").to(device)
        prompt = tokenizer(text, return_tensors="pt").to(device)
        generation = model.generate(
            input_ids=description.input_ids,
            attention_mask=description.attention_mask,
            prompt_input_ids=prompt.input_ids,
            prompt_attention_mask=prompt.attention_mask,
        )
        return np.atleast_1d(generation.cpu().numpy().squeeze())

    def voiced_runs(samples: np.ndarray) -> list[tuple[int, int]]:
        # Stretches of speech, in 50 ms frames, louder than a tenth of the loudest frame.
        frame = int(rate * 0.05)
        energy = np.array([np.abs(samples[i : i + frame]).mean() for i in range(0, len(samples), frame)])
        voiced = energy > energy.max() * 0.1
        runs, start = [], None
        for index, is_voiced in enumerate(voiced):
            if is_voiced and start is None:
                start = index
            if not is_voiced and start is not None:
                runs.append((start, index))
                start = None
        if start is not None:
            runs.append((start, len(voiced)))
        return runs

    def is_clean(text: str, samples: np.ndarray) -> bool:
        # The model sometimes repeats or rambles on a very short input ("कर्म" said twice, "क" for
        # five seconds). A take is kept when a word or two is one stretch of speech and no text runs
        # far longer than its letters need.
        runs = voiced_runs(samples)
        speech = sum(end - start for start, end in runs) * 0.05
        letters = len(text.replace(" ", ""))
        if len(text.split()) <= 2 and any(runs[i + 1][0] - runs[i][1] >= 10 for i in range(len(runs) - 1)):
            return False
        return speech <= max(1.0, letters * 0.22) * 2

    def trimmed(samples: np.ndarray) -> np.ndarray:
        runs = voiced_runs(samples)
        if not runs:
            return samples
        frame = int(rate * 0.05)
        start = max(0, runs[0][0] * frame - int(rate * 0.1))
        end = min(len(samples), runs[-1][1] * frame + int(rate * 0.15))
        return samples[start:end]

    def speak_line(text: str, voice: str, seeds: range = range(8)) -> np.ndarray | None:
        # Seeds in a fixed order, so a re-run picks the same take; the first clean one wins.
        best = None
        for seed in seeds:
            samples = speak(text, voice, seed)
            if len(samples) < rate * 0.25:
                continue
            if is_clean(text, samples):
                return trimmed(samples)
            if best is None or len(samples) < len(best):
                best = samples
        return None if best is None else trimmed(best)

    pause = np.zeros(int(rate * 0.7), dtype=np.float32)
    failed = []
    for index, item in enumerate(todo, 1):
        lines = item.get("segments") or [item["text"]]
        # A stubborn item can ask for a wider search: {"seedStart": 8, "tries": 24}.
        seeds = range(item.get("seedStart", 0), item.get("seedStart", 0) + item.get("tries", 8))
        spoken = [speak_line(line, item["description"], seeds) for line in lines]
        if any(part is None for part in spoken):
            failed.append(item["key"])
            print(f"{index}/{len(todo)} {item['key'][:12]} FAILED (no audio): {lines[0][:40]}", file=sys.stderr, flush=True)
            continue
        parts = []
        for part in spoken:
            parts += [part, pause]
        samples = np.concatenate(parts[:-1])
        (out / f"{item['key']}.mp3").write_bytes(to_mp3(samples, rate))
        print(f"{index}/{len(todo)} {item['key'][:12]} {len(samples) / rate:.1f}s", file=sys.stderr, flush=True)
    if failed:
        print(f"{len(failed)} item(s) produced no audio and were skipped", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
