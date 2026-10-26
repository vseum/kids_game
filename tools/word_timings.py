"""Время каждого слова для подсветки в карточке аята: что сейчас звучит — подсвечено зелёным.

    /путь/к/venv/python tools/word_timings.py      # нужен faster-whisper (pip install faster-whisper) и ffmpeg

Арабский: разметка слов чтения Мишари аль-Афаси с quran.com (api.qurancdn.com, reciter 7) — та же запись, что
voice/qari/<n>.mp3; время переносим на наш файл по началу и концу речи.
Перевод: распознаём voice/<голос>/tr_*.mp3 (faster-whisper, ru, word_timestamps) и сопоставляем слова с текстом.
Переозвучили переводы или сменили основной голос — запустить заново.
Результат: js/ayat_words.js (window.AYAT_WORDS).
"""
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))
from tts import load_lines  # noqa: E402

BASE = "eugene"
CACHE = ROOT / "tools" / ".cache" / "qdc"
FILES = ["js/ayat.js", "js/w12.js", "js/w3.js", "js/w4.js", "js/w5.js"]
MARK = re.compile(r"^[\u06D6-\u06ED\u0615-\u061A۞]+$")


def ar_words(ar):
    """Слова арабского текста так же, как их режет карточка (engine.js arWords): знаки паузы — к слову, «يَا» — со следующим."""
    out = []
    for t in ar.split():
        if MARK.match(t) and out:
            continue
        if out and out[-1] == "يَا":
            out[-1] += " " + t
            continue
        out.append(t)
    return out


def parts():
    res = {}
    for f in FILES:
        s = (ROOT / f).read_text(encoding="utf-8")
        for m in re.finditer(r'"(\d+):(\d+)(?:-(\d+))?"\s*:\s*\{(.*?)\]\s*\}', s, re.S):
            for i, (n, ar) in enumerate(re.findall(r'\{\s*n:\s*(\d+),\s*ar:\s*"([^"]*)"', m.group(4))):
                res[n] = {"key": f"{m.group(1)}:{int(m.group(2)) + i}", "ar": ar}
            tr = re.search(r'tr:\s*"(tr_[\w]+)"', m.group(4))
            if tr:
                res.setdefault("_tr", set()).add(tr.group(1))
    return res


def chapter(c):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / f"{c}.json"
    if not f.exists():
        url = f"https://api.qurancdn.com/api/qdc/audio/reciters/7/audio_files?chapter={c}&segments=true"
        f.write_bytes(subprocess.run(["curl", "-sf", "-m", "30", url], capture_output=True, check=True).stdout)
    return {v["verse_key"]: v for v in json.loads(f.read_text())["audio_files"][0]["verse_timings"]}


def speech_span(mp3):
    out = subprocess.run(["ffmpeg", "-i", str(mp3), "-af", "silencedetect=noise=-40dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
    h, mi, se = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    dur = int(h) * 3600 + int(mi) * 60 + float(se)
    ss = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    sn = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    start = sn[0] if ss and ss[0] < 0.05 and sn else 0.0
    end = ss[-1] if ss and len(sn) < len(ss) else dur
    return start, end


def qari(p):
    res = {}
    for n, x in sorted(((k, v) for k, v in p.items() if k != "_tr"), key=lambda kv: int(kv[0])):
        v = chapter(x["key"].split(":")[0])[x["key"]]
        seg = [s for s in v["segments"] if len(s) >= 3]
        toks = ar_words(x["ar"])
        s0, e0 = speech_span(ROOT / "voice" / "qari" / f"{n}.mp3")
        q0, q1 = seg[0][1], seg[-1][2]
        k = (e0 - s0) / ((q1 - q0) / 1000) if q1 > q0 else 1
        if abs(k - 1) > 0.05:   # в файле лишний звук в конце — переносим только сдвигом
            k = 1
        words = {}
        for s in seg:
            words.setdefault(s[0], [round((s0 + (s[1] - q0) / 1000 * k) * 1000), round((s0 + (s[2] - q0) / 1000 * k) * 1000)])
        for i in range(1, len(toks) + 1):   # у слова нет времени — делим соседнее пополам
            if i not in words and i - 1 in words:
                pv = words[i - 1]; mid = (pv[0] + pv[1]) // 2; words[i] = [mid, pv[1]]; pv[1] = mid
        if sorted(words) != list(range(1, len(toks) + 1)):
            print(f"qari {n} ({x['key']}): слов {len(toks)}, разметка {len(words)} — пропускаю", flush=True)
            continue
        res[n] = [words[i] for i in range(1, len(toks) + 1)]
    return res


norm = lambda w: re.sub(r"[^а-яё]", "", w.lower().replace("ё", "е"))


def translations(ids, lines):
    from faster_whisper import WhisperModel
    model = WhisperModel("small", device="cpu", compute_type="int8")
    res = {}
    for tid in sorted(ids):
        mp3 = ROOT / "voice" / BASE / f"{tid}.mp3"
        if tid not in lines or not mp3.exists():
            continue
        ours = lines[tid].split()
        import numpy as np   # декодируем сами: встроенный декодер faster-whisper (PyAV) капризен к версиям
        pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
        segs, _ = model.transcribe(np.frombuffer(pcm, np.int16).astype(np.float32) / 32768, language="ru", word_timestamps=True, beam_size=5)
        asr = [w for s in segs for w in s.words]
        a, b = [norm(w) for w in ours], [norm(w.word) for w in asr]
        t = [None] * len(ours)
        for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
            for j in range(blk.size):
                w = asr[blk.b + j]
                t[blk.a + j] = [round(w.start * 1000), round(w.end * 1000)]
        # слова без пары (тире, скобки, неточно распознанные) — делим промежуток между соседями по длине слов
        i = 0
        while i < len(t):
            if t[i] is None:
                j = i
                while j < len(t) and t[j] is None:
                    j += 1
                lo = t[i - 1][1] if i > 0 else (t[j][0] if j < len(t) else 0)
                hi = t[j][0] if j < len(t) else (lo + 400 * (j - i))
                tot = sum(max(1, len(norm(ours[k])) or 1) for k in range(i, j))
                acc = lo
                for k in range(i, j):
                    d = (hi - lo) * max(1, len(norm(ours[k])) or 1) / tot
                    t[k] = [round(acc), round(acc + d)]; acc += d
                i = j
            else:
                i += 1
        res[tid] = t
        print(f"{tid}: слов {len(ours)}, распознано {len(asr)}", flush=True)
    return res


def main():
    p = parts()
    lines = load_lines()
    tr_ids = p.get("_tr", set()) | {k for k in lines if k.startswith("tr_")}
    data = {"qari": qari(p), "tr": {"voice": BASE, "w": translations(tr_ids, lines)}}
    js = ("/* Время слов для подсветки в карточке аята (мс от начала файла). Делает tools/word_timings.py — руками не править.\n"
          "   qari[n] — слова аята n (как режет arWords), tr.w[id] — слова перевода (по пробелам) в голосе tr.voice */\n"
          "window.AYAT_WORDS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    (ROOT / "js" / "ayat_words.js").write_text(js, encoding="utf-8")
    print(f"js/ayat_words.js: аятов {len(data['qari'])}, переводов {len(data['tr']['w'])}")


if __name__ == "__main__":
    main()
