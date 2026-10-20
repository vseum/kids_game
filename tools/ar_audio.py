"""Арабские звуки для «Алиф-Ба»: названия букв, слоги с огласовками, слова-примеры.

    python3 tools/ar_audio.py --list               # только список → alifba/ar_items.json (для суфлёра)
    <venv>/python tools/ar_audio.py [--missing]    # озвучка → voice/ar/*.mp3 (нужен pip install edge-tts)

Откуда звук:
  1. Слова из Корана (alifba/ar_quran.json) — живая пословная запись чтеца quran.com (audio.qurancdn.com/wbw).
  2. Остальное — нейроголос Microsoft (edge-tts, по умолчанию ar-SA-ZariyahNeural, --voice меняет).
     Названия букв и слова он читает хорошо; отдельные слоги (بَ بِ بُ) любой синтез читает как название буквы
     или глотает гласный — их записывает человек (суфлёр, раздел «Арабские звуки»), записи заменят файлы с теми же id.
     ⚠ edge-tts — бесплатный конечный пункт браузера Edge; для платной версии тот же голос — через Azure TTS (бесплатно до 0,5 млн знаков/мес).
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


# Подсказки чтения по-русски для суфлёра: (согласный, тяжёлая ли буква, как произносить)
SAY = {
    "alif": ("", False, "Алиф сам не звучит: держит хамзу (короткий «толчок» голоса) или тянет «а»"),
    "ba": ("б", False, "как русское «б»"), "ta": ("т", False, "мягкое «т», кончик языка у верхних зубов"),
    "tha": ("с", False, "межзубный «с»: кончик языка между зубами, как англ. th в think"),
    "jim": ("дж", False, "слитное «дж»"),
    "hha": ("х", False, "глухой выдох из середины горла, как будто дышишь на стекло — без хрипа"),
    "kha": ("х", True, "грубое «х» с хрипом из верха горла; гласные рядом звучат твёрже"),
    "dal": ("д", False, "как русское «д»"),
    "dhal": ("з", False, "межзубный «з»: кончик языка между зубами, как англ. th в this"),
    "ra": ("р", False, "одно короткое касание «р»; с фатхой и даммой звучит твёрдо (ро, ру), с кясрой — мягче (ри)"),
    "zay": ("з", False, "как русское «з»"), "sin": ("с", False, "как русское «с»"), "shin": ("ш", False, "мягкое «ш»"),
    "sad": ("с", True, "твёрдое, «толстое» «с»: спинка языка приподнята; фатха звучит ближе к «о» (со)"),
    "dad": ("д", True, "твёрдое «д» боком языка о коренные зубы; фатха ближе к «о» (до)"),
    "tta": ("т", True, "твёрдое, «толстое» «т»; фатха ближе к «о» (то)"),
    "zza": ("з", True, "твёрдый межзубный «з»; фатха ближе к «о» (зо)"),
    "ain": ("ʿ", False, "звук из середины горла: горло сжато, голос «продавливается»; на письме ʿ"),
    "ghain": ("г", True, "раскатистое «г», как картавое французское r, из верха горла"),
    "fa": ("ф", False, "как русское «ф»"),
    "qaf": ("к", True, "глубокое «к» корнем языка у самого горла; фатха ближе к «о» (ко)"),
    "kaf": ("к", False, "обычное «к»"), "lam": ("л", False, "мягкое «ль»"), "mim": ("м", False, "как «м»"), "nun": ("н", False, "как «н»"),
    "ha": ("һ", False, "лёгкий выдох, как англ. h в hello"), "waw": ("в", False, "губной звук, как англ. w"),
    "ya": ("й", False, "как «й»"), "hamza": ("ʼ", False, "короткая остановка голоса, как в «не-а»"),
}
WORD_READ = {"alif": "ард", "ba": "байт", "ta": "тиин", "tha": "самар (межзубный с)", "jim": "джабаль", "hha": "хаджар (х из горла)",
             "kha": "хубз (грубое х)", "dal": "дальв", "dhal": "захаб (межзубный з)", "ra": "рум-маан", "zay": "зайтуун", "sin": "самааʼ",
             "shin": "шамс", "sad": "сохрох", "dad": "дыйааʼ (твёрдое д)", "tta": "тыын (твёрдое т)", "zza": "зылль (твёрдый межзубный з)",
             "ain": "ʿинаб (ʿ — горло)", "ghain": "гамаам (картавое г)", "fa": "фаджр", "qaf": "комар (глубокое к)", "kaf": "китааб",
             "lam": "лайль", "mim": "мааʼ", "nun": "наджм", "ha": "һилааль (лёгкое h)", "waw": "варак", "ya": "йаум", "hamza": "мааʼ (в конце — остановка голоса)"}
HOW = {"a": "фатха — коротко «а»", "i": "кясра — коротко «и»", "u": "дамма — коротко «у»", "sk": "сукун: буква без гласного, прилипает к «а» перед ней",
       "an": "танвин — «ан» на конце", "in": "танвин — «ин» на конце", "un": "танвин — «ун» на конце",
       "aa": "долгое «а» — тяни 2 счёта", "ii": "долгое «и» — тяни 2 счёта", "uu": "долгое «у» — тяни 2 счёта"}


def reading(l, h):
    c, heavy, _ = SAY[l["id"]]
    if l["id"] == "alif":
        c = ""
    a = "о" if heavy or (l["id"] == "ra") else "а"
    v = {"a": a, "i": "и", "u": "у", "an": a + "н", "in": "ин", "un": "ун", "aa": a * 2, "ii": "ии", "uu": "уу"}
    if h == "sk":
        return {"waw": "ау", "ya": "ай"}.get(l["id"], "а" + c)   # أَوْ / أَيْ — дифтонги
    return (c + v[h]) if c else v[h]


def items():
    out = []
    ls = letters()
    for l in ls:
        out.append({"id": f"ar_name_{l['id']}", "t": l["name"], "g": "Названия букв", "hint": l["ru"], "read": l["ru"], "tip": SAY[l["id"]][2]})
    for l in ls:
        out.append({"id": f"ar_w_{l['id']}", "t": l["word"], "g": "Слова-примеры", "hint": l["ru"], "read": WORD_READ[l["id"]], "tip": "на конце слова — остановка: последний гласный не читается"})
    for h, g in [("a", "Фатха: а"), ("i", "Кясра: и"), ("u", "Дамма: у"), ("sk", "Сукун"), ("an", "Танвин: ан"),
                 ("in", "Танвин: ин"), ("un", "Танвин: ун"), ("aa", "Долгое а"), ("ii", "Долгое и"), ("uu", "Долгое у")]:
        for l in ls:
            if l["id"] == "alif" and h in ("sk", "aa", "ii", "uu"):
                continue                       # у алифа этих слогов нет (он сам — удлинение)
            out.append({"id": f"ar_{l['id']}_{h}", "t": syl(l, h), "g": g, "hint": l["ru"], "read": reading(l, h), "tip": (HOW[h] + " · " if h in ("sk", "aa", "ii", "uu") else "") + l["ru"] + ": " + SAY[l["id"]][2]})
    seen = {x["id"] for x in out}
    for f in sorted((ROOT / "alifba").glob("ar_extra_*.json")):   # слова и слоги, которые добавили главы уровней 2–5
        for x in json.loads(f.read_text(encoding="utf-8")):
            if x["id"] not in seen:
                seen.add(x["id"]); out.append({"id": x["id"], "t": x["t"], "g": x.get("g", "Слова"), "hint": x.get("hint", ""), "read": x.get("hint", "")})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--missing", action="store_true")
    ap.add_argument("--voice", default="ar-SA-ZariyahNeural")
    ap.add_argument("--only", default="", help="регулярка по id: озвучить только эти")
    a = ap.parse_args()
    its = items()
    (ROOT / "alifba" / "ar_items.json").write_text(json.dumps(its, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(len(its), "арабских звуков")
    if a.list:
        return
    quran = json.loads((ROOT / "alifba" / "ar_quran.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    for n, it in enumerate(its, 1):
        out = OUT / f"{it['id']}.mp3"
        if a.missing and out.exists() or a.only and not re.search(a.only, it["id"]):
            continue
        with tempfile.TemporaryDirectory() as td:
            raw = Path(td) / "raw.mp3"
            if it["id"] in quran:
                subprocess.run(["curl", "-sfL", "-A", "Mozilla/5.0", "-o", str(raw), "https://audio.qurancdn.com/" + quran[it["id"]]["url"]], check=True)
            else:
                subprocess.run([sys.executable, "-m", "edge_tts", "--voice", a.voice, "--text", it["t"], "--write-media", str(raw)], check=True, capture_output=True)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", "silenceremove=start_periods=1:start_threshold=-45dB,adelay=120:all=1,apad=pad_dur=0.15,loudnorm=I=-16:TP=-1.5:LRA=11",
                            "-ar", "44100", "-ac", "1", "-b:a", "64k", str(out)], check=True)
        if n % 50 == 0:
            print(n, flush=True)
    have = sorted(p.stem for p in OUT.glob("*.mp3"))
    (OUT / "manifest.json").write_text(json.dumps(have, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print("готово:", len(have))


if __name__ == "__main__":
    main()
