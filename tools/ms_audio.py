"""Звук строк упражнений «Муаллим сани» (alifba/js/ms_data.js) → voice/ar/ms_<md5>.mp3 + alifba/js/ms_audio.js.

    /home/user/ttsenv/bin/python tools/ms_audio.py [--force] [--only REGEX] [--audit]

Откуда звук, по порядку:
  1. Слово есть в Коране буква в букву (с огласовками) — живая пословная запись чтеца quran.com (audio.qurancdn.com/wbw).
     Индекс слов Корана — api.quran.com, кэш в --qcache. Номер файла считаем сами по настоящим словам аята: audio_url из API
     считает и знаки паузы (ۚ ۖ), и в таких аятах под «قُلْ» звучит соседнее слово. Чтеца тоже проверяем, до 6 мест на слово.
  2. Прежний слог «Алиф-Ба» с тем же текстом (voice/ar/ar_<буква>_<огласовка>.mp3), если есть.
  3. Иначе — нейроголос Microsoft (edge-tts): Zariyah, потом Hamed, обычный и медленный темп. Одно слово синтез часто
     читает «с остановкой» и глотает конечную огласовку (زَمْزَمُ → «замзам»), поэтому второй вариант — «слово слово»:
     первое прочитано полностью, его отрезаем по разметке фонем и проверяем отдельно.
Каждый вариант проверяет распознаватель фонем (wav2vec2-xlsr-53-espeak-cv-ft): согласные и гласные должны совпасть
с написанным. Не прошёл ни один вариант — звука нет (неверный звук учит неверному чтению), слово уходит
в суфлёр (alifba/ar_extra_ms.json → раздел «Арабские звуки»), там его записывает человек.
Уже существующие файлы не трогаем без --force: живые записи главнее. Откуда каждый звук — alifba/ms_audio_src.json
(записанный человеком помечать там «запись»). --recheck перепроверяет готовые файлы (кроме записей) и переделывает непрошедшее.
--audit — только проверить существующие слоги букв (ar_<буква>_a/_sk) и вывести, какие не прошли.
"""
import argparse
import asyncio
import hashlib
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "voice" / "ar"
VOICES = [("ar-SA-ZariyahNeural", "-15%"), ("ar-SA-HamedNeural", "-15%"), ("ar-SA-ZariyahNeural", "-35%"), ("ar-SA-HamedNeural", "-35%")]

FATHA, KASRA, DAMMA, SUKUN, SHADDA = "َ", "ِ", "ُ", "ْ", "ّ"
MARKS = re.compile(r"[ً-ْٰ]")


def lessons():
    src = (ROOT / "alifba" / "js" / "ms_data.js").read_text(encoding="utf-8")
    return json.loads(src[src.index("= [") + 2:src.rindex("]") + 1])


def item_id(t):
    return "ms_" + hashlib.md5(t.encode("utf-8")).hexdigest()[:8]


# ---------- индекс слов Корана ----------
def quran_index(cache):
    if Path(cache).exists():
        return json.loads(Path(cache).read_text(encoding="utf-8"))
    out = {}
    for ch in range(1, 115):
        page = 1
        while True:
            url = f"https://api.quran.com/api/v4/verses/by_chapter/{ch}?words=true&word_fields=text_imlaei&per_page=50&page={page}"
            d = json.loads(subprocess.run(["curl", "-sf", "-A", "Mozilla/5.0", "--retry", "3", url], capture_output=True, check=True).stdout)
            for v in d["verses"]:
                c, a = (int(x) for x in v["verse_key"].split(":"))
                k = 0
                for w in v["words"]:
                    if w.get("char_type_name") != "word":
                        continue
                    k += 1   # номер файла — по настоящим словам; audio_url из API считает и знаки паузы, и уезжает
                    occ = out.setdefault(w["text_imlaei"], [])
                    if len(occ) < 6:
                        occ.append(f"wbw/{c:03}_{a:03}_{k:03}.mp3")
            if not d["pagination"]["next_page"]:
                break
            page += 1
    Path(cache).write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    return out


def qnorm(t):
    return re.sub(r"[ۖ-ٰۭـ]", "", t.replace("ٱ", "ا"))


# ---------- что должно прозвучать ----------
# Согласная → классы фонем, которые распознаватель может выдать. Горловые ء ع ح ه он часто не слышит — их пропуск не ошибка.
CONS = {
    "ب": "B", "م": "MNB", "ن": "NM", "ف": "FB", "ت": "T", "د": "TZ", "ط": "T", "ض": "TZ", "ث": "ZSFT", "ذ": "ZST", "ظ": "ZST",
    "س": "S", "ز": "SZ", "ص": "S", "ش": "SJ", "ج": "JSK", "ك": "K", "ق": "KG", "خ": "HKG", "غ": "GRHK", "ح": "H", "ه": "H",
    "ع": "Q", "ء": "Q", "أ": "Q", "إ": "Q", "ر": "RL", "ل": "LNR", "و": "W", "ي": "Y",
}
OPTIONAL = set("ءأإعحه")
VOW = {FATHA: "a", KASRA: "i", DAMMA: "u"}


def expected(t):
    """Список (класс, необязательный). Классы согласных — буквы CONS, гласные — a/i/u."""
    seq, chars = [], list(t)
    k = 0
    while k < len(chars):
        c = chars[k]; k += 1
        marks = ""
        while k < len(chars) and MARKS.match(chars[k]):
            marks += chars[k]; k += 1
        last_v = seq[-1][0] if seq and seq[-1][0] in "aiu" else None
        if c == "ا" and not marks:
            continue                                    # удлинение «а» (или алиф-васль без огласовки)
        if c in "وي" and not marks and last_v == ("u" if c == "و" else "i"):
            continue                                    # удлинение «у» / «и»
        if c == "ا":                                    # алиф-васль с огласовкой: اِبْنُ
            pass
        elif c in CONS:
            seq.append((CONS[c], c in OPTIONAL))
            if SHADDA in marks:
                seq.append((CONS[c], True))
        for m in marks:
            if m in VOW:
                seq.append((VOW[m], False))
    return seq


# Фонема распознавателя → классы
def tok_classes(p):
    p = re.sub(r"\d", "", p).replace("ː", "").replace("ˤ", "").replace("ʰ", "").replace("ʲ", "").replace("̪", "").replace("ˠ", "")
    V = {"a": "a", "ɑ": "a", "æ": "a", "ɐ": "a", "ʌ": "au", "ɛ": "ai", "ə": "aiu", "e": "i", "eɪ": "i", "i": "i", "ɪ": "i", "ɨ": "iu",
         "ɔ": "ua", "o": "ua", "u": "u", "ʊ": "u", "ø": "u", "ɵ": "u", "oʊ": "u", "aɪ": "a", "aʊ": "a", "y": "iu", "ʏ": "u", "ɯ": "u", "ɤ": "ua"}
    if p in V:
        return V[p]
    C = {"b": "B", "v": "BWF", "p": "B", "β": "BW", "m": "M", "n": "N", "ŋ": "N", "ɲ": "N", "f": "F", "t": "T", "d": "T", "θ": "ZF", "ð": "Z",
         "s": "S", "z": "S", "ʃ": "S", "ʒ": "SJ", "ɕ": "S", "ʑ": "S", "k": "K", "ɡ": "KJ", "g": "KJ", "q": "K", "ɢ": "K", "c": "K",
         "x": "HG", "χ": "HG", "ħ": "HQ", "h": "H", "ɦ": "H", "ç": "H", "ʕ": "Q", "ʔ": "Q", "ɣ": "G", "ʁ": "GR", "r": "R", "ɾ": "R",
         "ɹ": "R", "ʀ": "RG", "l": "L", "ɫ": "L", "ɬ": "L", "w": "W", "ʋ": "W", "j": "Y", "dʒ": "J", "tʃ": "J", "ts": "T", "dz": "S"}
    return C.get(p, "?")


# Дифтонги и слитные знаки распознавателя — на отдельные звуки: «aɪ» в زَيْتُ — это «а» и «й», а не потерянная Йа
SPLIT = {"aɪ": "a j", "ai": "a j", "aʊ": "a w", "au": "a w", "ɑu": "a w", "eɪ": "e j", "ei": "e j", "oʊ": "o w", "ou": "o w",
         "ɔɪ": "o j", "oɪ": "o j", "ja": "j a", "ju": "j u", "iə": "i ə", "ɑɹ": "ɑ ɹ", "ɔɹ": "ɔ ɹ", "oɹ": "o ɹ", "ɛɹ": "ɛ ɹ",
         "ɪɹ": "ɪ ɹ", "ʊɹ": "ʊ ɹ", "əl": "ə l", "aɪə": "a j ə", "aɪɚ": "a j ə",
         "iɛ": "i ɛ", "iɑ": "i ɑ", "ia": "i a", "ua": "u a", "uo": "u o", "ɑu": "ɑ w"}


def expand(rec):
    out, src = [], []
    for i, p in enumerate(rec):
        for q in SPLIT.get(re.sub(r"[\d.ː]", "", p), p).split():
            out.append(q); src.append(i)
    return out, src


def align(exp, rec):
    """Взвешенная правка между ожидаемым (класс, необязательный, строгий) и распознанным.
    Возвращает (ошибки, для каждого ожидаемого — индекс сопоставленной фонемы в rec или None)."""
    rec, src = expand(rec)
    R = [tok_classes(p) for p in rec]
    n, m = len(exp), len(R)
    INF = 1e9
    D = [[INF] * (m + 1) for _ in range(n + 1)]
    B = [[None] * (m + 1) for _ in range(n + 1)]
    D[0][0] = 0
    for i in range(n + 1):
        for j in range(m + 1):
            if D[i][j] >= INF:
                continue
            if i < n:   # ожидаемое пропущено: гласная — ошибка, согласная и конечная огласовка — грубая (كَوْنُ → «каану» не пройдёт)
                c = D[i][j] + (0 if exp[i][1] else 2 if exp[i][2] else 1 if exp[i][0] in "aiu" else 1.5)
                if c < D[i + 1][j]: D[i + 1][j], B[i + 1][j] = c, "d"
            if j < m:   # лишняя фонема: вставные гласные и придыхания почти бесплатно
                ins = 0.3 if R[j] in ("aiu", "Q", "H") or (R[j] and set(R[j]) <= set("aiu")) and len(R[j]) > 1 else 1
                c = D[i][j] + ins
                if c < D[i][j + 1]: D[i][j + 1], B[i][j + 1] = c, "i"
            if i < n and j < m:
                ok = bool(set(exp[i][0]) & set(R[j]))
                # و/ي могут прозвучать гласными у/и
                if not ok and exp[i][0] == "W" and "u" in R[j]: ok = True
                if not ok and exp[i][0] == "Y" and "i" in R[j]: ok = True
                c = D[i][j] + (0 if ok else 1)
                if c < D[i + 1][j + 1]: D[i + 1][j + 1], B[i + 1][j + 1] = c, "m"
    mp, i, j = [None] * n, n, m
    while i or j:
        b = B[i][j]
        if b == "m": i -= 1; j -= 1; mp[i] = src[j]
        elif b == "d": i -= 1
        else: j -= 1
    return D[n][m], mp


def exp_of(t, final_strict=True):
    e = [(c, o, False) for c, o in expected(t)]
    if final_strict and e and e[-1][0] in "aiu":
        e[-1] = (e[-1][0], False, True)
    return e


def limit(t):
    need = len([e for e in expected(t) if not e[1]])
    return 0.6 if need <= 4 else 1.3


def passes(t, rec):
    s, _ = align(exp_of(t), rec)
    return s <= limit(t), s


# ---------- распознаватель фонем ----------
class Phon:
    def __init__(self):
        import torch
        from huggingface_hub import hf_hub_download
        from transformers import AutoModelForCTC, Wav2Vec2FeatureExtractor
        name = "facebook/wav2vec2-xlsr-53-espeak-cv-ft"
        self.torch = torch
        self.fe = Wav2Vec2FeatureExtractor.from_pretrained(name)
        self.m = AutoModelForCTC.from_pretrained(name).eval()
        self.voc = {v: k for k, v in json.load(open(hf_hub_download(name, "vocab.json"))).items()}

    def spans(self, path):
        """Фонемы с кадрами (кадр — 20 мс): [(фонема, первый кадр, последний кадр)]"""
        a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                                         capture_output=True, check=True).stdout, np.float32)
        x = self.fe(a, sampling_rate=16000, return_tensors="pt").input_values
        with self.torch.no_grad():
            ids = self.m(x).logits.argmax(-1)[0].tolist()
        out, prev = [], None
        for f, i in enumerate(ids):
            if i == prev and out and i != 0:
                out[-1][2] = f
            elif i != 0:
                t = self.voc.get(i, "")
                if t and not t.startswith("<"):
                    out.append([t, f, f])
            prev = i
        return out

    def __call__(self, path):
        return [t for t, _, _ in self.spans(path)]


def cut_first(phon, t, raw, cut):
    """Синтез «слово слово»: первое прочитано без остановки, с конечной огласовкой. Отрезаем его по разметке фонем."""
    sp = phon.spans(raw)
    e1 = exp_of(t)
    e2 = [(c, True if k == len(e1) - 1 and c in "aiu" else o, False) for k, (c, o, _) in enumerate(exp_of(t, False))]
    s, mp = align(e1 + e2, [x[0] for x in sp])
    a = [mp[k] for k in range(len(e1)) if mp[k] is not None]
    b = [mp[len(e1) + k] for k in range(len(e2)) if mp[len(e1) + k] is not None]
    if not a or not b or mp[len(e1) - 1] is None:
        return False
    end1, start2 = sp[a[-1]][2] + 1, sp[b[0]][1]
    if start2 <= end1:
        return False
    sec = min(end1 + 4, (end1 + start2) / 2) * 0.02
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-t", f"{sec:.3f}", "-af", "afade=t=out:st=%.3f:d=0.04" % max(0, sec - 0.04), str(cut)], check=True)
    return True


def finish(raw, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af",
                    # тишину по краям убираем мягко: жёсткий порог срезал тихий конец слова (конечное «-у», «-т»)
                    "silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.06,areverse,"
                    "silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.12,areverse,"
                    "adelay=80:all=1,apad=pad_dur=0.1,loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-ar", "44100", "-ac", "1", "-b:a", "64k", str(out)], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--audit", action="store_true")
    ap.add_argument("--recheck", action="store_true", help="перепроверить готовые файлы (кроме записей) и переделать непрошедшее")
    ap.add_argument("--qcache", default=str(Path(tempfile.gettempdir()) / "ms_qwords.json"))
    a = ap.parse_args()
    phon = Phon()

    if a.audit:
        H = {"a": FATHA, "sk": SUKUN}
        src = (ROOT / "alifba" / "js" / "data.js").read_text(encoding="utf-8")
        for lid, ch in re.findall(r'\{ id: "(\w+)",\s*ch: "(.)"', src):
            for h in ("a", "sk"):
                f = OUT / f"ar_{lid}_{h}.mp3"
                if not f.exists():
                    continue
                t = ("أ" + FATHA + ch + SUKUN) if h == "sk" else (("أ" if lid == "alif" else ch) + FATHA)
                ok, s = passes(t, phon(f))
                print("OK " if ok else "BAD", f.stem, t, s, flush=True)
        return

    L = lessons()
    Q = {qnorm(k): v for k, v in quran_index(a.qcache).items()}
    items = []
    for les in L:
        for g in les["groups"]:
            for r in g["rows"] + [g.get("pairs", [])]:
                for t in r:
                    if t not in [x["t"] for x in items]:
                        items.append({"t": t, "les": les["id"], "l": g["l"]})
    # слог для схемы рта: «أَ + буква с сукуном» — так в таджвиде ищут, где рождается звук буквы
    chars = dict(re.findall(r'\{ id: "(\w+)",\s*ch: "(.)"', (ROOT / "alifba" / "js" / "data.js").read_text(encoding="utf-8")))
    for les in L:
        for g in les["groups"]:
            t = "أَ" + chars[g["l"]] + SUKUN
            if not les.get("madd") and g["l"] != "alif" and t not in [x["t"] for x in items]:
                items.append({"t": t, "les": les["id"], "l": g["l"]})
    SRC = ROOT / "alifba" / "ms_audio_src.json"   # откуда каждый звук: quran / голос синтеза / запись
    srcs = json.loads(SRC.read_text(encoding="utf-8")) if SRC.exists() else {}
    # прежние слоги «Алиф-Ба» (voice/ar/ar_<буква>_<огласовка>.mp3): если текст совпадает — ещё один кандидат, тоже с проверкой
    OLD = {}
    for lid, ch in chars.items():
        base = lambda h: ("إ" if h == "i" else "أ") if lid == "alif" else ch
        for h, t in [("a", base("a") + FATHA), ("i", base("i") + KASRA), ("u", base("u") + DAMMA), ("sk", "أ" + FATHA + ch + SUKUN),
                     ("aa", base("a") + FATHA + "ا"), ("ii", base("i") + KASRA + "ي"), ("uu", base("u") + DAMMA + "و")]:
            f = OUT / f"ar_{lid}_{h}.mp3"
            if f.exists() and not (lid == "alif" and h in ("sk", "aa", "ii", "uu")):
                OLD.setdefault(t, f)
    report = []
    OUT.mkdir(parents=True, exist_ok=True)
    for n, it in enumerate(items, 1):
        t, iid = it["t"], item_id(it["t"])
        out = OUT / f"{iid}.mp3"
        if a.only and not re.search(a.only, t + " " + iid):   # не трогаем, но в итоговые файлы попадает
            report.append({**it, "id": iid, "src": srcs.get(iid, "есть") if out.exists() else None})
            continue
        if out.exists() and not a.force:
            was = srcs.get(iid) or "есть"
            if not (a.recheck and was not in ("запись", "есть") and not passes(t, phon(out))[0]):
                report.append({**it, "id": iid, "src": was})
                continue
            print("перепроверка не прошла:", t, was, flush=True)
            out.unlink()   # непрошедший файл не остаётся, даже если замены не найдётся
        if not out.exists() and iid in srcs and srcs[iid] is None and not a.force:
            report.append({**it, "id": iid, "src": None})   # уже не прошёл ни один вариант — ждёт живой записи (--force — пробовать снова)
            continue
        res = {**it, "id": iid, "src": None, "tries": []}
        with tempfile.TemporaryDirectory() as td:
            cands = [("quran", u, "") for u in Q.get(qnorm(t), [])] + ([("old", OLD[t], "")] if t in OLD else [])
            cands += [("tts", v, mode) for v in VOICES for mode in ("one", "two")]
            for k, (kind, arg, mode) in enumerate(cands):
                raw = Path(td) / f"raw{k}.mp3"
                name = "quran:" + arg if kind == "quran" else "прежний " + arg.stem if kind == "old" else arg[0][6:-6] + arg[1] + ("·2" if mode == "two" else "")
                if kind == "old":
                    raw = arg
                elif kind == "quran":
                    if subprocess.run(["curl", "-sfL", "-A", "Mozilla/5.0", "--retry", "3", "-o", str(raw), "https://audio.qurancdn.com/" + arg]).returncode:
                        res["tries"].append({"v": name, "err": "нет файла"})
                        continue
                else:
                    import edge_tts
                    err = None
                    for _ in range(3):
                        try:
                            asyncio.run(edge_tts.Communicate(t if mode == "one" else t + " " + t, arg[0], rate=arg[1]).save(str(raw)))
                            err = None
                            break
                        except Exception as e:   # сеть
                            err = e
                    if err:
                        res["tries"].append({"v": name, "err": str(err)})
                        continue
                    if mode == "two":
                        cut = Path(td) / f"cut{k}.wav"
                        if not cut_first(phon, t, raw, cut):
                            res["tries"].append({"v": name, "err": "не разрезать"})
                            continue
                        raw = cut
                rec = phon(raw)
                ok, s = passes(t, rec)
                res["tries"].append({"v": name, "rec": " ".join(rec), "s": round(s, 2), "ok": ok})
                if ok:
                    finish(raw, out)
                    ok2, s2 = passes(t, phon(out))   # и готовый файл — после обрезки и выравнивания громкости
                    if not ok2:
                        out.unlink()
                        res["tries"][-1].update(ok=False, err=f"после обработки {s2:.1f}")
                        continue
                    res["src"] = "quran" if kind == "quran" else name
                    break
        report.append(res)
        print(n, t, res["src"] or "НЕТ", "|", res["tries"][-1].get("rec", "") if res["tries"] else "", flush=True)

    have = sorted(p.stem for p in OUT.glob("*.mp3"))
    (OUT / "manifest.json").write_text(json.dumps(have, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    m = {x["t"]: x["id"] for x in report}
    (ROOT / "alifba" / "js" / "ms_audio.js").write_text(
        "/* Звук строк «Муаллим сани»: текст → id файла voice/ar/<id>.mp3 (tools/ms_audio.py). Есть ли файл — смотрит AR.have */\n"
        "window.MS_AUDIO = " + json.dumps(m, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    # суфлёр: все слова уроков, сначала те, что без звука
    les_t = {x["id"]: x["title"] for x in L}
    extra = sorted(({"id": x["id"], "t": x["t"], "g": ("Муаллим: нет звука · " if not x["src"] else "Муаллим · ") + les_t[x["les"]], "hint": les_t[x["les"]]}
                    for x in report), key=lambda e: (not e["g"].startswith("Муаллим: нет"), e["g"]))
    (ROOT / "alifba" / "ar_extra_ms.json").write_text(json.dumps(extra, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    Path(tempfile.gettempdir(), "ms_audio_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    srcs.update({x["id"]: x["src"] for x in report if x["src"] != "есть"})
    srcs = {k: v for k, v in srcs.items() if k in {x["id"] for x in report}}   # слова, которых больше нет в уроках, — вон
    SRC.write_text(json.dumps(dict(sorted(srcs.items())), ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    src = [x["src"] for x in report]
    print("итог:", len(report), "· Коран", src.count("quran"), "· синтез", sum(1 for s in src if s and s not in ("quran", "есть", "запись")),
          "· без звука", src.count(None))


if __name__ == "__main__":
    main()
