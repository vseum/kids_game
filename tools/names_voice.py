"""Озвучка имён детей: игра зовёт ребёнка по имени («Амина!»).

    python3 tools/names_voice.py [--speaker eugene] [--missing]

Список — tools/names.tsv (имя, имя с ударением «+», пол). Файлы: voice/<голос>/names/<id>.mp3,
указатель для игры — voice/<голос>/names.json: [["Амина", "amina"], …].
id — латиница от имени без учёта е/ё, поэтому «Артем» и «Артём» — одно имя.
"""
import argparse
import importlib.util
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("tts", Path(__file__).with_name("tts.py"))
tts = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tts)

LAT = dict(zip("абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
               ["a", "b", "v", "g", "d", "e", "e", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "f",
                "h", "ts", "ch", "sh", "sch", "", "y", "", "e", "yu", "ya"]))


def name_id(name):
    s = "".join(LAT.get(c, c) for c in name.lower().replace("ё", "е"))
    return "".join(c if c.isascii() and (c.isalnum() or c == "-") else "-" for c in s).strip("-")


def load():
    rows = [l.rstrip("\n").split("\t") for l in (ROOT / "tools" / "names.tsv").read_text(encoding="utf-8").splitlines() if l.strip()]
    out, used = [], {}
    for name, stressed, _ in rows:
        base = name_id(name); i = base; k = 2
        while i in used and used[i] != name.lower().replace("ё", "е"):
            i = f"{base}{k}"; k += 1
        used[i] = name.lower().replace("ё", "е")
        out.append((name, stressed, i))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--speaker", default="eugene", choices=tts.SPEAKERS)
    ap.add_argument("--missing", action="store_true")
    args = ap.parse_args()
    import numpy as np
    import soundfile as sf

    names = load()
    out_dir = tts.VOICE / args.speaker / "names"
    out_dir.mkdir(parents=True, exist_ok=True)
    for n, (name, stressed, i) in enumerate(names, 1):
        out = out_dir / f"{i}.mp3"
        if args.missing and out.exists():
            continue
        audio, rate = tts.Engine.say(args.speaker, stressed + "!")
        pad = np.zeros(int(rate * 0.08), dtype=np.float32)
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            sf.write(tmp.name, np.concatenate([pad, audio, pad]), rate)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp.name, "-af",
                            "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
                            "-ar", "44100", "-ac", "1", "-b:a", "64k", str(out)], check=True)
        if n % 100 == 0:
            print(f"[{args.speaker}] {n}/{len(names)}", flush=True)
    have = [[name, i] for name, _, i in names if (out_dir / f"{i}.mp3").exists()]
    (tts.VOICE / args.speaker / "names.json").write_text(json.dumps(have, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Готово: {len(have)} имён", flush=True)


if __name__ == "__main__":
    main()
