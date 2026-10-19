"""Список для суфлёра (zapis.html): все реплики игры в порядке прохождения, с подписью главы.

    python3 tools/zapis_items.py  →  zapis.json

ﷺ показываем словами, как их нужно произнести; переводы аятов идут сразу после главы, где карточка.
"""
import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("tts", Path(__file__).with_name("tts.py"))
tts = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(tts)


def main():
    lines = tts.load_lines()
    src = "".join((ROOT / "js" / f).read_text(encoding="utf-8") for f in ["chapters.js", "w12.js", "w3.js", "w4.js", "w5.js", "ayat.js"])
    regs = re.findall(r'regChapter\((\d),\s*\{\s*id:\s*"(\w+)",\s*name:\s*"([^"]+)".*?lines:\s*"(\w+)"', src)
    regs.sort(key=lambda r: int(r[0]))          # уровень, внутри — порядок регистрации
    items, seen = [], set()

    def add(k, group):
        if k in lines and k not in seen:
            seen.add(k)
            text = lines[k].replace("ﷺ", "(саллаллаху алейхи ва саллям)")
            items.append({"id": k, "g": group, "t": text})

    for k in lines:
        if k.startswith("intro"):
            add(k, "Вступление")
    num = {}
    for lvl, cid, name, pre in regs:
        num[lvl] = num.get(lvl, 0) + 1
        group = f"Уровень {int(lvl) + 1} · Глава {num[lvl]}: {name}"
        for k in lines:
            ok = k.startswith(pre) if len(pre) > 1 else re.match(re.escape(pre) + r"(\d|q|_)", k)
            if ok and not k.startswith("tr_"):
                add(k, group)
        # перевод аята этой главы — из её кода: ayahCard("S:A…") → tr_<S>_<A>
        fn = re.search(r'fn:\s*(\w+)', src[src.find(f'id: "{cid}"'):]).group(1)
        fbody = src[src.find(f"async function {fn}("):]
        fbody = fbody[: fbody.find("\nasync function ", 10) if "\nasync function " in fbody[10:] else len(fbody)]
        for key in re.findall(r'ayahCard\("([\d:-]+)"\)', fbody):
            m = re.search(r'"%s":\s*\{[^}]*?tr:\s*"(tr_\w+)"' % re.escape(key), src, re.S)
            if m:
                add(m.group(1), group)
    for k in lines:
        add(k, "Финал и общие фразы")
    (ROOT / "zapis.json").write_text(json.dumps(items, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(len(items), "реплик;", sum(i["g"] == "Финал и общие фразы" for i in items), "без главы")


if __name__ == "__main__":
    main()
