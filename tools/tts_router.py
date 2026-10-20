"""Озвучка через OpenRouter (/api/v1/audio/speech): ElevenLabs, Gemini TTS, MiniMax, MAI-Voice, Fish Audio — одним ключом.

Ключ — переменная окружения OPENROUTER_API_KEY (настройки облачной среды или Timeweb, не в чат и не в git).

    python3 tools/tts_router.py --sample                                  # образцы всех кандидатов → obrazcy/*.mp3
    python3 tools/tts_router.py --lang ru --model M --voice V --dir el_ru [--missing] [id ...]   # реплики игр → voice/<dir>/
    python3 tools/tts_router.py --lang ar --model M --voice V --dir ar [--missing] [id ...]      # арабские звуки «Алиф-Ба»

Модели и голоса: curl -s "https://openrouter.ai/api/v1/models?output_modalities=speech"
Стиль (--instructions) понимают Gemini TTS, gpt-4o-mini-tts и Fish Audio; остальные его не читают.
Слова из Корана (alifba/ar_quran.json) не озвучиваем — там голос чтеца.
--voice azat — клон голоса Азата по его записям из суфлёра (Fish Audio; бесплатная модель: fish-audio/s2.1-pro-free:free).
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from tts import load_lines, prepare  # noqa: E402
from ar_audio import items as ar_items  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
URL = "https://openrouter.ai/api/v1/audio/speech"
RU_STYLE = "Тёплый добрый рассказчик для детей 5–7 лет: спокойно, ясно, с улыбкой, не торопясь."
AR_STYLE = ("A Quran teacher pronouncing Arabic for small children: clear classical Arabic (fusha) with correct makharij, "
            "slow and precise. Read exactly what is written with its vowel marks; a single letter with a vowel mark is "
            "a syllable sound (بُ = 'bu'), never the letter's name.")
# кандидаты для --sample: (модель, голос, стиль). Голоса ElevenLabs — многоязычные, говорят и по-русски, и по-арабски
CANDIDATES = [
    ("elevenlabs/eleven-v4", "george", None), ("elevenlabs/eleven-v4", "sarah", None), ("elevenlabs/eleven-v3", "brian", None),
    ("google/gemini-3.8-flash-tts", "Charon", "style"), ("google/gemini-3.8-flash-tts", "Kore", "style"),
    ("minimax/speech-2.8-hd", "English_expressive_narrator", None),
    ("fish-audio/s2.1-pro-free:free", None, "style"),            # бесплатная
    ("fish-audio/s2.1-pro-free:free", "azat", "style"),          # бесплатная, клон голоса Азата по записям суфлёра
]
SAMPLE_RU = ["intro1", "intro2", "k2", "f_quran"]
SAMPLE_AR = ["ar_name_ain", "ar_name_qaf", "ar_ba_u", "ar_jim_i", "ar_qaf_i", "ar_ain_a", "ar_sad_u", "ar_hha_i", "ar_ba_sk",
             "ar_ba_an", "ar_ba_aa", "ar_w_shin", "ar_l5_ashshams"]


def azat_ref(lang):
    """Образец голоса Азата для клонирования: его записи из суфлёра (ветка data репозитория jarvis-azata) одним WAV + текст.
    Русский — реплики игры, арабский — названия букв и слова."""
    jarvis = ROOT.parent / "jarvis-azata"
    subprocess.run(["git", "-C", str(jarvis), "fetch", "-q", "origin", "data:refs/remotes/origin/data"], check=False)
    names = subprocess.run(["git", "-C", str(jarvis), "ls-tree", "--name-only", "origin/data", "igra/rec/"], capture_output=True, text=True).stdout.split()
    want = [n for n in names if n.endswith(".wav") and (Path(n).stem.startswith("ar_") == (lang == "ar"))][:12]
    tx = texts(lang) if lang == "ar" else {x["id"]: x["t"] for x in json.loads((ROOT / "zapis.json").read_text(encoding="utf-8"))}
    with tempfile.TemporaryDirectory() as td:
        parts = []
        for n in want:
            f = Path(td) / Path(n).name
            f.write_bytes(subprocess.run(["git", "-C", str(jarvis), "show", f"origin/data:{n}"], capture_output=True).stdout)
            parts.append(f)
        lst = Path(td) / "l.txt"; lst.write_text("".join(f"file '{p}'\n" for p in parts))
        out = Path(td) / "ref.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-af", "apad=pad_dur=0.3", "-ar", "24000", "-ac", "1", str(out)], check=True)
        import base64
        return {"data": "data:audio/wav;base64," + base64.b64encode(out.read_bytes()).decode(),
                "text": " ".join(tx.get(Path(n).stem, "") for n in want)}


REFS = {}


def speak(text, model, voice, instructions, out, lang="ru"):
    body = {"model": model, "input": text, "response_format": "mp3"}
    if voice == "azat":   # клон: голос не указываем, даём образец
        ref = REFS.setdefault(lang, azat_ref(lang))
        body["input_references"] = [{"type": "input_audio", "input_audio": {"data": ref["data"]}}, {"type": "text", "text": ref["text"]}]
    elif voice:
        body["voice"] = voice
    if instructions:
        body["instructions"] = instructions
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), method="POST", headers={
        "Authorization": "Bearer " + os.environ["OPENROUTER_API_KEY"], "Content-Type": "application/json"})
    for k in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r, tempfile.NamedTemporaryFile(suffix=".mp3") as tmp:
                tmp.write(r.read()); tmp.flush()
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp.name, "-af",
                                "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
                                "adelay=100:all=1,apad=pad_dur=0.12,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "1", "-b:a", "64k", str(out)], check=True)
                return True
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:300]
            if e.code in (400, 401, 402, 403, 404):
                print(f"{out.stem}: HTTP {e.code} {msg}", flush=True); return False
        except Exception as e:  # сеть, таймаут — повторяем
            msg = str(e)
        time.sleep(3 * (k + 1))
    print(f"{out.stem}: не вышло ({msg})", flush=True)
    return False


def texts(lang):
    if lang == "ru":
        return {i: prepare(t, stress=False) for i, t in load_lines().items()}
    quran = json.loads((ROOT / "alifba" / "ar_quran.json").read_text(encoding="utf-8"))
    return {x["id"]: x["t"] for x in ar_items() if x["id"] not in quran}


def sample():
    out_dir = ROOT.parent / "obrazcy"; out_dir.mkdir(exist_ok=True)
    ru, ar = texts("ru"), texts("ar")
    for model, voice, st in CANDIDATES:
        name = (model.split("/")[1] + ("_" + voice if voice else "")).replace(".", "-")
        parts = []
        with tempfile.TemporaryDirectory() as td:
            for lang, ids, style in (("ru", SAMPLE_RU, RU_STYLE), ("ar", SAMPLE_AR, AR_STYLE)):
                for i in ids:
                    f = Path(td) / f"{len(parts):03d}.mp3"
                    if speak((ru if lang == "ru" else ar)[i], model, voice, style if st else None, f, lang):
                        parts.append(f)
            if not parts:
                continue
            lst = Path(td) / "list.txt"
            lst.write_text("".join(f"file '{p}'\n" for p in parts))
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-af", "apad=pad_dur=0.4",
                            "-b:a", "96k", str(out_dir / f"{name}.mp3")], check=True)
        print("образец:", out_dir / f"{name}.mp3", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample", action="store_true")
    ap.add_argument("--lang", choices=["ru", "ar"])
    ap.add_argument("--model"); ap.add_argument("--voice"); ap.add_argument("--dir")
    ap.add_argument("--instructions", default="")
    ap.add_argument("--missing", action="store_true")
    ap.add_argument("ids", nargs="*")
    a = ap.parse_args()
    if not os.environ.get("OPENROUTER_API_KEY"):
        sys.exit("нет OPENROUTER_API_KEY в окружении")
    if a.sample:
        return sample()
    tx = texts(a.lang)
    out_dir = ROOT / "voice" / a.dir; out_dir.mkdir(parents=True, exist_ok=True)
    style = a.instructions or (RU_STYLE if a.lang == "ru" else AR_STYLE)
    todo = [i for i in (a.ids or tx) if tx.get(i) and not (a.missing and (out_dir / f"{i}.mp3").exists())]
    with ThreadPoolExecutor(6) as ex:
        ok = sum(ex.map(lambda i: speak(tx[i], a.model, a.voice, style, out_dir / f"{i}.mp3", a.lang), todo))
    have = sorted(p.stem for p in out_dir.glob("*.mp3"))
    (out_dir / "manifest.json").write_text(json.dumps(have, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print(f"озвучено {ok} из {len(todo)}; в папке {len(have)}")


if __name__ == "__main__":
    main()
