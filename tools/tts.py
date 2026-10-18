#!/usr/bin/env python3
"""Озвучка всех реплик игры бесплатными нейросетями Silero TTS и Piper (работают без интернета после скачивания моделей).

Установка (один раз):
    pip install torch --index-url https://download.pytorch.org/whl/cpu
    pip install numpy scipy soundfile omegaconf piper-tts
    # нужен ffmpeg

Запуск:
    python tools/tts.py --speaker xenia            # озвучить все реплики голосом xenia (в папку voice/xenia/)
    python tools/tts.py --all                      # озвучить всеми голосами
    python tools/tts.py --speaker xenia b1 b2      # только выбранные
    python tools/tts.py --speaker xenia --missing  # только те, у которых ещё нет файла

Голоса и лицензии — в таблице VOICES ниже. Silero v5_6_ru: CC BY-NC 4.0; Silero v5_cis_base: MIT;
Piper denis: датасет CC0; Piper ruslan: датасет CC BY-NC-SA 4.0. Игра бесплатная, указание авторства — на стартовом экране.
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
CACHE = ROOT / "tools" / ".cache"
SILERO = "https://models.silero.ai/models/tts/ru/{}.pt"
PIPER = "https://huggingface.co/rhasspy/piper-voices/resolve/main/ru/ru_RU/{0}/medium/ru_RU-{0}-medium.onnx"

# голос в игре -> (движок, модель, диктор)
VOICES = {
    "xenia": ("silero", "v5_6_ru", "xenia"), "baya": ("silero", "v5_6_ru", "baya"), "kseniya": ("silero", "v5_6_ru", "kseniya"),
    "aidar": ("silero", "v5_6_ru", "aidar"), "eugene": ("silero", "v5_6_ru", "eugene"),
    "alexandr": ("silero", "v5_cis_base", "ru_alexandr"), "roman": ("silero", "v5_cis_base", "ru_roman"),
    "denis": ("piper", "denis", None), "ruslan": ("piper", "ruslan", None),
}
SPEAKERS = list(VOICES)

# Арабские фразы целиком: с дефисами модель их коверкает
PHRASES = {
    "А'узу би-Ллях": "+Аузу билл+ях", "Хасбуна-Ллаху ва ниъмаль-вакиль": "Хасбуналл+аху ва н+иъмаль вак+иль",
    "Хасбуна-Ллах": "Хасбуналл+ах", "Мухаммадур расулю Ллах": "Мух+аммадур рас+улюллах", "Ля иляха илля Ллах": "Ля ил+яха илл+аллах",
}

# Ударения ("+" перед ударной гласной) и произношение арабских слов
STRESS = {
    "Аллах": "Алл+ах", "Аллаха": "Алл+аха", "Аллаху": "Алл+аху", "Аллахом": "Алл+ахом",
    "Бисмиллях": "Бисмилл+ях", "Субханаллах": "Субханалл+ах", "Альхамдулиллях": "Альхамдулилл+ях",
    "Ас-саляму": "Ас-сал+яму", "алейкум": "ал+ейкум", "аят": "а+ят", "Коране": "Кор+ане", "Коран": "Кор+ан",
    "Милостивого": "М+илостивого",
    "Таурат": "Таур+ат", "Забур": "Заб+ур", "Инджиль": "Индж+иль", "Инджил": "Индж+ил", "Дауду": "Да+уду", "Дауд": "Да+уд",
    "Муса": "М+уса", "Мусе": "М+усе", "Мусы": "М+усы", "Иса": "+Иса", "Исе": "+Исе", "Исы": "+Исы",
    "Ибрахим": "Ибрах+им", "Ибрахиму": "Ибрах+иму", "Исмаил": "Исма+ил", "Юнус": "Ю+нус", "Юнуса": "Ю+нуса",
    "Мухаммад": "Мух+аммад", "Мухаммада": "Мух+аммада", "Мухаммаду": "Мух+аммаду",
    "шахада": "шах+ада", "шахаду": "шах+аду", "шахады": "шах+ады", "закят": "зак+ят", "закята": "зак+ята",
    "садака": "садак+а", "садаку": "садак+у", "ихрам": "ихр+ам", "микат": "мик+ат", "Микат": "Мик+ат", "таваф": "тав+аф",
    "ифтар": "ифт+ар", "магриб": "м+агриб", "иша": "иш+а", "Рамадан": "Рамад+ан", "ракаате": "рака+ате", "ракаатов": "рака+атов",
    "Фатиха": "Ф+атиха", "Фатиху": "Ф+атиху", "Фатихи": "Ф+атихи", "Ихлас": "Ихл+ас", "Фаляк": "Ф+аляк",
    "шайтан": "шайт+ан", "шайтана": "шайт+ана", "шайтаны": "шайт+аны", "джиннов": "дж+иннов",
    "Кааба": "Ка+аба", "Каабе": "Ка+абе", "Каабу": "Ка+абу", "Каабы": "Ка+абы", "Мекка": "М+екка", "Мекку": "М+екку", "Мекки": "М+екки", "Мекке": "М+екке",
    "аята": "а+ята", "аятов": "а+ятов", "аяты": "а+яты", "сура": "с+ура", "суру": "с+уру", "суры": "с+уры", "суре": "с+уре",
    "намаз": "нам+аз", "намаза": "нам+аза", "намазе": "нам+азе", "намазов": "нам+азов", "намазах": "нам+азах",
    "Ллах": "Лл+ах", "Ллаху": "Лл+аху", "Ллях": "Лл+ях", "иляха": "ил+яха", "илля": "+илля", "Акбар": "+Акбар",
    "А'узу": "+Аузу", "Хасбуна": "Хасб+уна", "ниъмаль": "н+иъмаль", "вакиль": "вак+иль", "расулю": "рас+улю", "Мухаммадур": "Мух+аммадур",
    "саллаллаху": "саллалл+аху", "алейхи": "ал+ейхи", "саллям": "салл+ям",
}


def load_lines():
    """Все реплики: js/lines.js и js/w*_lines.js. В каждом файле объект с репликами — чистый JSON."""
    lines = {}
    for f in sorted((ROOT / "js").glob("*lines*.js")):
        s = f.read_text(encoding="utf-8")
        start = s.index("{", s.index("window.LINES"))
        lines.update(json.loads(s[start:s.rindex("}") + 1]))
    return lines


def prepare(text, stress=True):
    text = text.replace("ﷺ", ", саллаллаху алейхи ва саллям,")
    text = re.sub(r"[؀-ۿﭐ-﷿ﹰ-﻿]+", "", text)  # арабские буквы модель не читает
    text = text.replace("«", "").replace("»", "").replace('"', "").replace(" - ", ", ")
    text = re.sub(r"\(([^)]*)\)", r", \1,", text)
    for phrase, said in PHRASES.items():
        text = text.replace(phrase, said if stress else said.replace("+", ""))
    if stress:   # Piper знаки "+" не понимает: ударения ставит сам
        for word, stressed in STRESS.items():
            text = re.sub(r"(?<![\w+])" + word + r"(?![\w+])", stressed, text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([,.!?:])", r"\1", text)
    return re.sub(r",+\s*([,.!?:])", r"\1", text).strip()


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


def fetch(url, dest):
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        print("Скачиваю", url)
        urllib.request.urlretrieve(url, dest)
    return dest


class Engine:
    """Синтез одной фразы: возвращает (массив float32, частота)."""
    loaded = {}

    @classmethod
    def say(cls, voice, text):
        import numpy as np
        engine, model, speaker = VOICES[voice]
        key = engine + ":" + model
        if engine == "silero":
            if key not in cls.loaded:
                import torch
                path = fetch(SILERO.format(model), CACHE / f"{model}.pt")
                cls.loaded[key] = torch.package.PackageImporter(str(path)).load_pickle("tts_models", "model")
            return cls.loaded[key].apply_tts(text=text, speaker=speaker, sample_rate=48000).numpy(), 48000
        onnx = fetch(PIPER.format(model), CACHE / "piper" / f"ru_RU-{model}-medium.onnx")
        fetch(PIPER.format(model) + ".json", CACHE / "piper" / f"ru_RU-{model}-medium.onnx.json")
        import soundfile as sf
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            subprocess.run([sys.executable, "-m", "piper", "-m", str(onnx), "-f", tmp.name], input=text.encode("utf-8"),
                           check=True, capture_output=True)
            audio, rate = sf.read(tmp.name, dtype="float32")
        return np.asarray(audio, dtype=np.float32), rate


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--speaker", default="eugene", choices=SPEAKERS)
    ap.add_argument("--all", action="store_true", help="озвучить всеми голосами")
    ap.add_argument("--missing", action="store_true", help="озвучить только реплики без файла")
    ap.add_argument("ids", nargs="*")
    args = ap.parse_args()

    lines = load_lines()
    ids = args.ids or list(lines)
    unknown = [i for i in ids if i not in lines]
    if unknown:
        sys.exit("Нет таких реплик: " + ", ".join(unknown))
    for speaker in (SPEAKERS if args.all else [args.speaker]):
        render(lines, ids, speaker, args.missing)


def render(lines, ids, speaker, missing):
    import numpy as np
    import soundfile as sf

    out_dir = VOICE / speaker
    out_dir.mkdir(parents=True, exist_ok=True)
    piper = VOICES[speaker][0] == "piper"
    for n, key in enumerate(ids, 1):
        out = out_dir / f"{key}.mp3"
        if missing and out.exists():
            continue
        audio, rate = [], 48000
        for part in chunks(prepare(lines[key], stress=not piper)):
            a, rate = Engine.say(speaker, part)
            audio += [a, np.zeros(int(rate * 0.25), dtype=np.float32)]
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            sf.write(tmp.name, np.concatenate([np.zeros(int(rate * 0.25), dtype=np.float32)] + audio), rate)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp.name, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                            "-ar", "44100", "-ac", "1", "-b:a", "64k", str(out)], check=True)
        print(f"[{speaker} {n}/{len(ids)}] {key}", flush=True)

    have = sorted(p.stem for p in out_dir.glob("*.mp3") if p.stem in lines)
    (out_dir / "manifest.json").write_text(json.dumps(have, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print(f"Готово: {speaker}, файлов {len(have)} из {len(lines)}")


if __name__ == "__main__":
    main()
