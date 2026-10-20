"""Озвучка через OpenRouter (/api/v1/audio/speech): ElevenLabs, Gemini TTS, MiniMax, MAI-Voice, Fish Audio — одним ключом.

Ключ — секрет облачной среды типа Bearer для хоста openrouter.ai (прокси подставляет его сам) или переменная
OPENROUTER_API_KEY. Не в чат и не в git.

    python3 tools/tts_router.py --sample [eleven Charon ...]              # образцы готовых голосов → obrazcy/*.mp3
    python3 tools/tts_router.py --lang ru --model M --voice V --dir el_ru [--missing] [id ...]   # реплики игр → voice/<dir>/
    python3 tools/tts_router.py --lang ar --model M --voice V --dir ar [--missing] [id ...]      # арабские звуки «Алиф-Ба»

Модели и голоса: curl -s "https://openrouter.ai/api/v1/models?output_modalities=speech"
Стиль (--instructions) понимают Gemini TTS и gpt-4o-mini-tts. Fish Audio его не понимает и зачитывает вслух — ему не шлём.
Голоса ElevenLabs/MiniMax английские: по-русски с акцентом. Родные русские — MAI-Voice (платно) и библиотека Fish (бесплатно).
Слова из Корана (alifba/ar_quran.json) не озвучиваем — там голос чтеца.
--voice azat — клон голоса Азата по его записям из суфлёра (Fish Audio; бесплатная модель: fish-audio/s2.1-pro-free:free).

Лимиты бесплатного OpenRouter (без купленных кредитов): платные модели отвечают 402, у :free — 50 запросов в сутки
и 20 в минуту. Поэтому образец — 2 запроса на голос (русские реплики одним текстом, арабские другим), после 402
голос сразу бросаем, на 429 ждём сброса лимита.
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
# кандидаты для --sample: (модель, голос, стиль) — только готовые голоса, без клонов. Голоса ElevenLabs многоязычные,
# у MAI-Voice есть родные русские, Gemini/MiniMax/Grok говорят на многих языках
FISH_RU = {"zh-spokoyny": "2a1036d645634680b3cc69aeeb60375b", "zh-teply": "f14e1f9fb32d4dbd8cd5b40a0fef86a5",
           "zh-myagky": "e64409e787324864bdf9e5c1b6acd97a", "zh-vyrazitelny": "aa615eaff73f417e91cfbb4ea0e42df8",
           "zh-molodoy": "d567e990d9ad433892ed15ecfd70ce54", "m-adam": "4177b0a68e4e46879c8e228ae388934f",
           "m-chyotky": "7312c38557eb4fb384e3874e8e9cea67", "m-rasskazchik": "48ec28a45588422b977a86460c11977f",
           "m-molodoy": "c962ed46edfd419abc530d1e33a7435f", "m-glubokiy": "fa3e3b7d3c2a44d88d9f018bc45db1ce"}
CANDIDATES = [
    *[("elevenlabs/eleven-v3", v, None) for v in ("george", "daniel", "brian", "sarah", "alice", "matilda")],
    *[("google/gemini-3.8-flash-tts", v, "style") for v in ("Charon", "Achird", "Puck", "Kore", "Aoede", "Sulafat")],
    *[("microsoft/mai-voice-2.1", f"ru-RU-{v}:MAI-Voice-2.1", None) for v in ("Lev", "Grant", "Masha", "Harper")],
    *[("minimax/speech-2.8-hd", v, None) for v in ("English_expressive_narrator", "English_CaptivatingStoryteller",
                                                    "English_Gentle-voiced_man", "English_Wiselady")],
    ("x-ai/grok-voice-tts-1.0", "leo", None), ("x-ai/grok-voice-tts-1.0", "eve", None),
    ("fish-audio/s2.1-pro-free:free", None, None),               # бесплатная
    # бесплатная Fish с родными русскими голосами-рассказчиками из библиотеки fish.audio (voice = id модели голоса;
    # список: https://api.fish.audio/model?language=ru&sort_by=task_count). Голоса знаменитостей не берём.
    *[("fish-audio/s2.1-pro-free:free", v, None, n) for n, v in FISH_RU.items()],
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


class NoCredits(Exception):
    """402: на аккаунте нет кредитов — дальше этой моделью не просим"""


def speak(text, model, voice, instructions, out, lang="ru"):
    body = {"model": model, "input": text, "response_format": "mp3"}
    if voice == "azat":   # клон: голос не указываем, даём образец
        ref = REFS.setdefault(lang, azat_ref(lang))
        body["input_references"] = [{"type": "input_audio", "input_audio": {"data": ref["data"]}}, {"type": "text", "text": ref["text"]}]
    elif voice:
        body["voice"] = voice
    if instructions and not model.startswith("fish-audio/"):   # Fish читает инструкцию вслух как текст
        body["instructions"] = instructions
    head = {"Content-Type": "application/json"}
    if os.environ.get("OPENROUTER_API_KEY"):   # иначе ключ подставляет прокси облачной среды (секрет Bearer для openrouter.ai)
        head["Authorization"] = "Bearer " + os.environ["OPENROUTER_API_KEY"]
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), method="POST", headers=head)
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
            if e.code == 402:
                raise NoCredits(msg)
            if e.code == 429:   # лимит в минуту: ждём до сброса (X-RateLimit-Reset — мс от эпохи), не тратя попытки впустую
                reset = e.headers.get("X-RateLimit-Reset")
                wait = max(5, min(90, int(reset) / 1000 - time.time() + 1)) if reset and reset.isdigit() else 60
                print(f"{out.stem}: лимит запросов, жду {wait:.0f} с", flush=True)
                time.sleep(wait); continue
            if e.code in (400, 401, 403, 404):
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


def sample(only=()):
    out_dir = ROOT / "obrazcy"; out_dir.mkdir(exist_ok=True)
    ru, ar = texts("ru"), texts("ar")

    def one(cand):
        model, voice, st, *label = cand
        name = (model.split("/")[1] + ("_" + (label[0] if label else voice.split(":")[0]) if voice else "")).replace(".", "-").replace(":", "-")
        if (out_dir / f"{name}.mp3").exists():
            print("уже есть:", name, flush=True); return name
        parts = []
        with tempfile.TemporaryDirectory() as td:
            # один запрос на язык: реплики подряд, каждая с новой строки — модель делает между ними паузу
            for lang, ids, style in (("ru", SAMPLE_RU, RU_STYLE), ("ar", SAMPLE_AR, AR_STYLE)):
                tx = ru if lang == "ru" else ar
                f = Path(td) / f"{lang}.mp3"
                try:
                    if speak("\n".join(tx[i] for i in ids), model, voice, style if st else None, f, lang):
                        parts.append(f)
                except NoCredits:
                    print(f"{name}: нет кредитов (402) — пропускаю", flush=True); return None
            if not parts:
                return None
            lst = Path(td) / "list.txt"
            lst.write_text("".join(f"file '{p}'\n" for p in parts))
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-af", "apad=pad_dur=0.4",
                            "-b:a", "96k", str(out_dir / f"{name}.mp3")], check=True)
        print("образец:", out_dir / f"{name}.mp3", flush=True)
        return name

    todo = [c for c in CANDIDATES if not only or any(o in " ".join(map(str, c)) for o in only)]
    free = [c for c in todo if c[0].endswith(":free")]
    with ThreadPoolExecutor(4) as ex:   # бесплатные — по одному, чтобы не упираться в 20 запросов в минуту
        done = [n for n in ex.map(one, [c for c in todo if c not in free]) if n]
    done += [n for n in map(one, free) if n]
    print(f"образцов {len(done)} из {len(todo)} → {out_dir}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample", action="store_true")
    ap.add_argument("--lang", choices=["ru", "ar"])
    ap.add_argument("--model"); ap.add_argument("--voice"); ap.add_argument("--dir")
    ap.add_argument("--instructions", default="")
    ap.add_argument("--missing", action="store_true")
    ap.add_argument("ids", nargs="*")
    a = ap.parse_args()
    if a.sample:
        return sample(a.ids)
    tx = texts(a.lang)
    out_dir = ROOT / "voice" / a.dir; out_dir.mkdir(parents=True, exist_ok=True)
    style = a.instructions or (RU_STYLE if a.lang == "ru" else AR_STYLE)
    todo = [i for i in (a.ids or tx) if tx.get(i) and not (a.missing and (out_dir / f"{i}.mp3").exists())]
    try:
        with ThreadPoolExecutor(1 if a.model.endswith(":free") else 6) as ex:
            ok = sum(ex.map(lambda i: speak(tx[i], a.model, a.voice, style, out_dir / f"{i}.mp3", a.lang), todo))
    except NoCredits as e:
        sys.exit(f"нет кредитов OpenRouter (402), остановлено: {e}")
    have = sorted(p.stem for p in out_dir.glob("*.mp3"))
    (out_dir / "manifest.json").write_text(json.dumps(have, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print(f"озвучено {ok} из {len(todo)}; в папке {len(have)}")


if __name__ == "__main__":
    main()
