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

    def speak_line(text: str, voice: str) -> np.ndarray | None:
        # The model now and then returns no audio for a very short input; another seed usually works.
        for seed in (0, 1, 2):
            samples = speak(text, voice, seed)
            if len(samples) >= rate * 0.25:
                return samples
        return None

    pause = np.zeros(int(rate * 0.7), dtype=np.float32)
    failed = []
    for index, item in enumerate(todo, 1):
        lines = item.get("segments") or [item["text"]]
        spoken = [speak_line(line, item["description"]) for line in lines]
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
