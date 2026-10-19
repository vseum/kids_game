"""Арабские звуки для «Алиф-Ба»: названия букв, слоги с огласовками, слова-примеры.

    python3 tools/ar_audio.py --list        # только список → alifba/ar_items.json (для суфлёра)
    python3 tools/ar_audio.py [--missing]   # ВРЕМЕННЫЙ синтез (Piper, ar_JO-kareem) → voice/ar/*.mp3

Синтез — заглушка: отдельные буквы и слоги он произносит неуверенно. Перед запуском эти звуки
записывает человек с правильным произношением (суфлёр, раздел «Арабские звуки»); записи заменят файлы с теми же id.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "voice" / "ar"
H = {"a": "َ", "i": "ِ", "u": "ُ", "an": "ً", "in": "ٍ", "un": "ٌ", "sk": "ْ"}


def letters():
    src = (ROOT / "alifba" / "js" / "data.js").read_text(encoding="utf-8")
    return [dict(id=m[0], ch=m[1], name=m[2], ru=m[3], word=m[4]) for m in
            re.findall(r'\{ id: "(\w+)",\s*ch: "(.)", name: "([^"]+)", ru: "([^"]+)".*?word: \["([^"]+)"', src)]


def syl(l, h):
    base = ("إ" if h in ("i", "in") else "أ") if l["id"] == "alif" else l["ch"]
    if h == "an":
        return base + H["an"] + ("" if l["id"] in ("hamza", "alif") else "ا")
    if h == "aa":
        return base + H["a"] + "ا"
    if h == "ii":
        return base + H["i"] + "ي"
    if h == "uu":
        return base + H["u"] + "و"
    if h == "sk":
        return "أ" + H["a"] + l["ch"] + H["sk"]
    return base + H[h]


def items():
    out = []
    ls = letters()
    for l in ls:
        out.append({"id": f"ar_name_{l['id']}", "t": l["name"], "g": "Названия букв", "hint": l["ru"]})
    for l in ls:
        out.append({"id": f"ar_w_{l['id']}", "t": l["word"], "g": "Слова-примеры", "hint": l["ru"]})
    for h, g in [("a", "Фатха: а"), ("i", "Кясра: и"), ("u", "Дамма: у"), ("sk", "Сукун"), ("an", "Танвин: ан"),
                 ("in", "Танвин: ин"), ("un", "Танвин: ун"), ("aa", "Долгое а"), ("ii", "Долгое и"), ("uu", "Долгое у")]:
        for l in ls:
            if l["id"] == "alif" and h in ("sk", "aa", "ii", "uu"):
                continue                       # у алифа этих слогов нет (он сам — удлинение)
            out.append({"id": f"ar_{l['id']}_{h}", "t": syl(l, h), "g": g, "hint": l["ru"]})
    seen = {x["id"] for x in out}
    for f in sorted((ROOT / "alifba").glob("ar_extra_*.json")):   # слова и слоги, которые добавили главы уровней 2–5
        for x in json.loads(f.read_text(encoding="utf-8")):
            if x["id"] not in seen:
                seen.add(x["id"]); out.append({"id": x["id"], "t": x["t"], "g": x.get("g", "Слова"), "hint": x.get("hint", "")})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--missing", action="store_true")
    a = ap.parse_args()
    its = items()
    (ROOT / "alifba" / "ar_items.json").write_text(json.dumps(its, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(len(its), "арабских звуков")
    if a.list:
        return
    model = Path("/tmp/claude-0/-home-user/25c7ba7c-b41d-59a8-b0d4-fbe091a9c0a7/scratchpad/ar/k.onnx")
    OUT.mkdir(parents=True, exist_ok=True)
    for n, it in enumerate(its, 1):
        out = OUT / f"{it['id']}.mp3"
        if a.missing and out.exists():
            continue
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            subprocess.run([sys.executable, "-m", "piper", "-m", str(model), "-f", tmp.name], input=it["t"].encode(), check=True, capture_output=True)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp.name, "-af", "adelay=120:all=1,apad=pad_dur=0.15,loudnorm=I=-16:TP=-1.5:LRA=11",
                            "-ar", "44100", "-ac", "1", "-b:a", "64k", str(out)], check=True)
        if n % 50 == 0:
            print(n, flush=True)
    have = sorted(p.stem for p in OUT.glob("*.mp3"))
    (OUT / "manifest.json").write_text(json.dumps(have, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print("готово:", len(have))


if __name__ == "__main__":
    main()
