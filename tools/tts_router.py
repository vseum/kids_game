"""Озвучка через OpenRouter (/api/v1/audio/speech): ElevenLabs, Gemini TTS, MiniMax, MAI-Voice, Fish Audio — одним ключом.

Ключ — секрет облачной среды типа Bearer для хоста openrouter.ai (прокси подставляет его сам) или переменная
OPENROUTER_API_KEY. Не в чат и не в git.

    python3 tools/tts_router.py --sample [eleven Charon ...]              # образцы готовых голосов → obrazcy/*.mp3
    python3 tools/tts_router.py --lang ru --model M --voice V --dir el_ru [--missing] [id ...]   # реплики игр → voice/<dir>/
    python3 tools/tts_router.py --lang ar --model M --voice V --dir ar [--missing] [id ...]      # арабские звуки «Алиф-Ба»
    python3 tools/tts_router.py --mix [--budget 45]         # озвучка «Смешанная» → voice/mix/ (см. MIX ниже)

--batch: много реплик одним запросом (бесплатный лимит — 50 запросов в сутки), запись режется по паузам между репликами
по распознаванию речи (pip install faster-whisper); реплика, которую не удалось уверенно найти, идёт в следующую пачку.

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
import difflib
import json
import os
import re
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
FINISH = ("silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
          "adelay=100:all=1,apad=pad_dur=0.12,loudnorm=I=-16:TP=-1.5:LRA=11")

# «Смешанная» озвучка: русский — рассказчик бесплатной Fish, а реплики с арабскими фразами (их Fish говорит плохо) остаются
# голосом Евгения — в voice/mix/ их просто нет, игра договаривает их основным голосом
MIX = ("fish-audio/s2.1-pro-free:free", "48ec28a45588422b977a86460c11977f", "mix")
AR_PHRASE = re.compile(r"ас-сал[яа]му|алейкум|бисмил|альхамдулил|субханал|акбар|иляха|илля|а'узу|хасбуна|расулю|мухаммадур|"
                       r"ин ша|инша|ма ша|маша|саллалла|ﷺ|ниъмаль|вакиль|\bамин\b", re.I)


def finish(src, out, start=None, end=None):
    """Срез записи [start, end] → обрезка тишины по краям, громкость, mp3 для игры"""
    cut = (["-ss", f"{start:.3f}"] if start else []) + (["-to", f"{end:.3f}"] if end else [])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), *cut, "-af", FINISH, "-ar", "44100", "-ac", "1", "-b:a", "64k", str(out)], check=True)


class NoCredits(Exception):
    """402: на аккаунте нет кредитов — дальше этой моделью не просим"""


def speak(text, model, voice, instructions, out, lang="ru", raw=False):
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
            with urllib.request.urlopen(req, timeout=300) as r, tempfile.NamedTemporaryFile(suffix=".mp3") as tmp:
                data = r.read()
                if raw:
                    Path(out).write_bytes(data); return True
                tmp.write(data); tmp.flush()
                finish(tmp.name, out)
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


def _tok(w):
    """Слово для сверки с распознанным: распознавание путает безударные о/а, е/и, двойные буквы"""
    w = w.lower().replace("ё", "е").replace("ъ", "").replace("ь", "")
    w = w.translate(str.maketrans("оэы", "аеи"))
    return re.sub(r"(.)\1+", r"\1", w)


def words(t):
    return [_tok(w) for w in re.findall(r"[а-яёa-z0-9]+", t.lower())]


def split_batch(wav, lines, asr):
    """Где в записи пачки каждая реплика: [(начало, конец) или None]. Слова распознанной речи сверяем с текстом,
    границу реплик ставим посередине самой длинной паузы между последним словом одной и первым словом следующей."""
    import numpy as np
    a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(wav), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                                     capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768
    segs, _ = asr.transcribe(a, language="ru", word_timestamps=True, condition_on_previous_text=False)
    rec = [(_tok(t), w.start, w.end) for s in segs for w in s.words for t in re.findall(r"[а-яёa-z0-9]+", w.word.lower())]
    exp = [(t, i) for i, l in enumerate(lines) for t in words(l)]
    sm = difflib.SequenceMatcher(None, [e[0] for e in exp], [r[0] for r in rec], autojunk=False)
    hit = {}                                     # номер слова текста → номер распознанного
    for b in sm.get_matching_blocks():
        for k in range(b.size):
            hit[b.a + k] = b.b + k
    pos = [[j for j, e in enumerate(exp) if e[1] == i] for i in range(len(lines))]
    span, edge = [], []
    for i, ps in enumerate(pos):
        got = [p for p in ps if p in hit]
        # почти все слова реплики должны найтись; края — по крайним найденным словам
        ok = ps and got and len(got) >= 0.8 * len(ps)
        span.append((rec[hit[got[0]]][1], rec[hit[got[-1]]][2]) if ok else None)
        edge.append((bool(ok) and got[0] == ps[0], bool(ok) and got[-1] == ps[-1]))   # нашлись ли первое и последнее слово
    # энергия кадрами по 10 мс, чтобы резать в тишине, а не по неточным меткам слов
    fr = 160; e = np.sqrt(np.convolve(a ** 2, np.ones(fr) / fr, "same")[::fr] + 1e-12)
    quiet = e < max(0.003, np.percentile(e, 20) * 1.5)

    def gap(t0, t1):                             # середина самой длинной тишины в [t0, t1]
        i0, i1 = max(0, int(t0 * 100)), min(len(quiet), int(t1 * 100) + 1)
        best, run, bi = 0, 0, None
        for k in range(i0, i1):
            run = run + 1 if quiet[k] else 0
            if run > best: best, bi = run, k
        return ((bi - best / 2) / 100, best) if bi is not None else (None, 0)

    out, last = [None] * len(lines), len(a) / 16000
    for i, sp in enumerate(span):
        if not sp:
            continue
        # не распознано крайнее слово (часто название буквы) — резать можно только по паузе до найденного соседа
        if (not edge[i][0] and i and not span[i - 1]) or (not edge[i][1] and i < len(lines) - 1 and not span[i + 1]):
            continue
        # с соседом, который нашёлся, режем в паузе между ними; иначе — в паузе у края своей реплики
        st, n = (0.0, 99) if i == 0 else gap(span[i - 1][1] - 0.2 if span[i - 1] else sp[0] - 0.8, sp[0] + 0.2)
        en, m = (last, 99) if i == len(lines) - 1 else gap(sp[1] - 0.2, span[i + 1][0] + 0.2 if span[i + 1] else sp[1] + 0.8)
        if st is not None and en is not None and n >= 8 and m >= 8 and en - st > 0.4:   # паузы хотя бы 80 мс с обеих сторон
            out[i] = (st, en)
    return out


def _audio(path):
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def check_piece(path, text, asr):
    """Нарезанная реплика целиком и без чужого: распознаём её и сверяем с текстом. Лишняя речь по краям (хвост соседа)
    или потерянное слово на краю — брак; ошибки распознавания внутри (имена, арабские слова) — не брак."""
    got = [_tok(t) for s in asr.transcribe(_audio(path), language="ru")[0] for t in re.findall(r"[а-яёa-z0-9]+", s.text.lower())]
    exp = words(text)
    if len(exp) <= 2:   # одно-два слова распознавание без контекста путает, а резать там нечего
        return True
    if not got:
        return False
    sm = difflib.SequenceMatcher(None, exp, got, autojunk=False)
    bl = [b for b in sm.get_matching_blocks() if b.size]
    if not bl or sm.ratio() < 0.6:
        return False
    head_exp, head_got = exp[:bl[0].a], got[:bl[0].b]
    tail_exp, tail_got = exp[bl[-1].a + bl[-1].size:], got[bl[-1].b + bl[-1].size:]
    # на краю распознано что-то, чего нет в тексте, а текстовое слово там нашлось — это чужая речь
    if (head_got and not head_exp) or (tail_got and not tail_exp):
        return False
    # на краю не хватает слова (больше одной-двух букв) и вместо него ничего не распознано — потеряно при нарезке
    if (len("".join(head_exp)) >= 4 and not head_got) or (len("".join(tail_exp)) >= 4 and not tail_got):
        return False
    return True


def free_left():
    head = {"Authorization": "Bearer " + os.environ["OPENROUTER_API_KEY"]} if os.environ.get("OPENROUTER_API_KEY") else {}
    with urllib.request.urlopen(urllib.request.Request("https://openrouter.ai/api/v1/key", headers=head), timeout=30) as r:
        return json.load(r)["data"]["free_model_daily_requests"]["remaining"]


def batch(tx, ids, model, voice, out_dir, budget, chars=1500):
    """Реплики пачками по ~chars символов одним запросом; не нашедшиеся в записи — в следующие пачки, помельче"""
    from faster_whisper import WhisperModel
    asr = WhisperModel("medium", device="cpu", compute_type="int8")
    todo, done, used, size, tries = list(ids), 0, 0, chars, {}
    cache = ROOT / "tools" / ".cache" / "batch"; cache.mkdir(parents=True, exist_ok=True)
    while todo and used < budget:
        if model.endswith(":free") and free_left() <= 0:
            print("бесплатные запросы на сегодня кончились"); break
        group, n = [], 0
        while todo and (not group or n + len(tx[todo[0]]) <= size):
            i = todo.pop(0); group.append(i); n += len(tx[i])
        lines = [t if re.search(r"[.!?…]$", t) else t + "." for t in (tx[i] for i in group)]
        raw = cache / f"{group[0]}.mp3"
        used += 1
        if not speak("\n".join(lines), model, voice, None, raw, raw=True):
            todo.extend(group); continue
        spans = split_batch(raw, lines, asr)
        miss = [i for i, sp in zip(group, spans) if not sp]
        for i, sp in zip(group, spans):
            if not sp:
                continue
            f = out_dir / f"{i}.mp3"
            finish(raw, f, *sp)
            tries[i] = tries.get(i, 0) + 1
            if check_piece(f, tx[i], asr) or tries[i] >= 3:   # на третий раз берём как есть: значит, путается распознавание
                done += 1
            else:
                f.unlink(); miss.append(i)
        todo.extend(miss)
        # много потерь — пачки помельче, всё нашлось — снова крупнее
        size = max(300, size // 2) if len(miss) * 3 > len(group) else min(chars, size * 2) if not miss else size
        print(f"запрос {used}: {len(group) - len(miss)} из {len(group)} реплик; готово {done}, осталось {len(todo)}"
              + (f"; не нашлись: {' '.join(miss)}" if miss else ""), flush=True)
    return done, todo


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
    ap.add_argument("--batch", action="store_true", help="пачками по ~1500 символов одним запросом")
    ap.add_argument("--mix", action="store_true", help="озвучка «Смешанная»: --batch --missing рассказчиком Fish без арабских фраз")
    ap.add_argument("--recheck", action="store_true", help="проверить готовые реплики распознаванием, брак удалить")
    ap.add_argument("--budget", type=int, default=45, help="--batch: не больше стольких запросов за запуск")
    ap.add_argument("ids", nargs="*")
    a = ap.parse_args()
    if a.sample:
        return sample(a.ids)
    if a.mix:
        a.lang, (a.model, a.voice, a.dir), a.batch, a.missing = "ru", MIX, True, True
    tx = texts(a.lang)
    if a.mix:   # реплики с арабскими фразами остаются голосом Евгения
        tx = {i: t for i, t in tx.items() if not AR_PHRASE.search(load_lines()[i])}
    out_dir = ROOT / "voice" / a.dir; out_dir.mkdir(parents=True, exist_ok=True)
    style = a.instructions or (RU_STYLE if a.lang == "ru" else AR_STYLE)
    todo = [i for i in (a.ids or tx) if tx.get(i) and not (a.missing and (out_dir / f"{i}.mp3").exists())]
    if a.recheck:
        from faster_whisper import WhisperModel
        asr = WhisperModel("medium", device="cpu", compute_type="int8")
        bad = [i for i in (a.ids or tx) if (out_dir / f"{i}.mp3").exists() and not check_piece(out_dir / f"{i}.mp3", tx[i], asr)]
        for i in bad:
            (out_dir / f"{i}.mp3").unlink()
        a.batch, todo = False, []
        print(f"брак {len(bad)}: {' '.join(bad)}")
    if a.batch:
        try:
            ok, left = batch(tx, todo, a.model, a.voice, out_dir, a.budget)
        except NoCredits as e:
            sys.exit(f"нет кредитов OpenRouter (402), остановлено: {e}")
        have = sorted(p.stem for p in out_dir.glob("*.mp3"))
        (out_dir / "manifest.json").write_text(json.dumps(have, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
        return print(f"озвучено {ok} из {len(todo)}; осталось {len(left)}; в папке {len(have)}")
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
