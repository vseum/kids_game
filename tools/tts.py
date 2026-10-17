#!/usr/bin/env python3
"""Озвучка всех реплик игры бесплатной нейросетью Silero TTS (работает без интернета после скачивания модели).

Установка (один раз):
    pip install torch --index-url https://download.pytorch.org/whl/cpu
    pip install numpy scipy soundfile omegaconf
    # нужен ffmpeg

Запуск:
    python tools/tts.py --speaker xenia            # озвучить все реплики
    python tools/tts.py --speaker xenia b1 b2      # только выбранные
    python tools/tts.py --speaker xenia --missing  # только те, у которых ещё нет файла

Голоса: aidar, eugene (мужские), baya, kseniya, xenia (женские).
Модели Silero распространяются по лицензии CC BY-NC 4.0: только некоммерческое использование, с указанием авторства.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE = ROOT / "voice"
MODEL_URL = "https://models.silero.ai/models/tts/ru/v5_6_ru.pt"
MODEL = ROOT / "tools" / ".cache" / "v5_6_ru.pt"
RATE = 48000

# Ударения ("+" перед ударной гласной) и произношение арабских слов
STRESS = {
    "Аллах": "Алл+ах", "Аллаха": "Алл+аха", "Аллаху": "Алл+аху", "Аллахом": "Алл+ахом",
    "Бисмиллях": "Бисмилл+ях", "Субханаллах": "Субханалл+ах", "Альхамдулиллях": "Альхамдулилл+ях",
    "Ас-саляму": "Ас-сал+яму", "алейкум": "ал+ейкум", "аят": "а+ят", "Коране": "Кор+ане", "Коран": "Кор+ан",
    "Милостивого": "М+илостивого",
}


def load_lines():
    s = (ROOT / "js" / "lines.js").read_text(encoding="utf-8")
    start = s.index("\nwindow.LINES =") + len("\nwindow.LINES =")
    return json.loads(s[start:s.rindex("};") + 1])


def prepare(text):
    text = re.sub(r"[؀-ۿﭐ-﷿ﹰ-﻿]+", "", text)  # арабские буквы модель не читает
    text = text.replace("«", "").replace("»", "").replace('"', "").replace(" - ", ", ")
    text = re.sub(r"\(([^)]*)\)", r", \1,", text)
    for word, stressed in STRESS.items():
        text = re.sub(r"(?<![\w+])" + word + r"(?![\w+])", stressed, text)
    return re.sub(r"\s+", " ", text).strip()


def chunks(text, limit=700):
    """Длинный текст (перевод аята) режем по предложениям: у модели есть предел длины."""
    if len(text) <= limit:
        return [text]
    out, cur = [], ""
    for sent in re.split(r"(?<=[.!?])\s+", text):
        if cur and len(cur) + len(sent) > limit:
            out.append(cur)
            cur = sent
        else:
            cur = (cur + " " + sent).strip()
    return out + ([cur] if cur else [])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--speaker", default="xenia", choices=["aidar", "baya", "kseniya", "eugene", "xenia"])
    ap.add_argument("--missing", action="store_true", help="озвучить только реплики без файла")
    ap.add_argument("ids", nargs="*")
    args = ap.parse_args()

    import numpy as np
    import soundfile as sf
    import torch

    if not MODEL.exists():
        MODEL.parent.mkdir(parents=True, exist_ok=True)
        print("Скачиваю модель Silero...")
        urllib.request.urlretrieve(MODEL_URL, MODEL)
    model = torch.package.PackageImporter(str(MODEL)).load_pickle("tts_models", "model")

    lines = load_lines()
    ids = args.ids or list(lines)
    unknown = [i for i in ids if i not in lines]
    if unknown:
        sys.exit("Нет таких реплик: " + ", ".join(unknown))
    VOICE.mkdir(exist_ok=True)
    pause = np.zeros(int(RATE * 0.25), dtype=np.float32)
    for n, key in enumerate(ids, 1):
        out = VOICE / f"{key}.mp3"
        if args.missing and out.exists():
            continue
        audio = []
        for part in chunks(prepare(lines[key])):
            audio += [model.apply_tts(text=part, speaker=args.speaker, sample_rate=RATE).numpy(), pause]
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            sf.write(tmp.name, np.concatenate([pause] + audio), RATE)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp.name, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                            "-ar", "44100", "-ac", "1", "-b:a", "80k", str(out)], check=True)
        print(f"[{n}/{len(ids)}] {key}")

    have = sorted(p.stem for p in VOICE.glob("*.mp3") if p.stem in lines)
    (VOICE / "manifest.json").write_text(json.dumps(have, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print(f"Готово. Файлов озвучки: {len(have)} из {len(lines)}")


if __name__ == "__main__":
    main()
