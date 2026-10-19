"""Реплики рассказчика про каждую букву «Алиф-Ба» — из таблицы alifba/js/data.js.

    python3 tools/alifba_lines.py  →  alifba/js/lines_letters.js

Ключи: a_<буква>_name («Это буква Ба»), a_<буква>_pic (на что похожа), a_<буква>_snd (как звучит),
a_<буква>_word (слово-пример), a_<буква>_find (найди букву по звуку). Текст — по-русски для голоса; арабское звучит отдельно.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = (ROOT / "alifba" / "js" / "data.js").read_text(encoding="utf-8")
rows = re.findall(r'\{ id: "(\w+)",\s*ch: "(.)", name: "[^"]+", ru: "([^"]+)",\s*snd: "([^"]+)", pic: "([^"]+)", word: \["[^"]+", "([^"]+)"', src)
L = {}
for lid, ch, ru, snd, pic, word in rows:
    nm = "круглая Ха" if lid == "ha" else ru
    L[f"a_{lid}_name"] = f"Это буква {nm}. Послушай, как её называют по-арабски."
    L[f"a_{lid}_pic"] = f"Посмотри: {pic}."
    if lid == "alif":
        L[f"a_{lid}_snd"] = "Сам Алиф не звучит. Он держит звук «а», когда ему помогает маленький знак хамза."
    elif lid == "hamza":
        L[f"a_{lid}_snd"] = "Хамза звучит как короткая остановка голоса, как будто говоришь «не-а»."
    else:
        L[f"a_{lid}_snd"] = f"Буква {nm} звучит как {snd}. Послушай."
    L[f"a_{lid}_word"] = f"Слово «{word}» по-арабски. Послушай."
    L[f"a_{lid}_find"] = f"Где буква {nm}? Нажми на неё."
out = "/* Реплики про буквы — сгенерированы tools/alifba_lines.py из js/data.js. Между \"{\" и последней \"}\" — чистый JSON */\nObject.assign(window.LINES, " + json.dumps(L, ensure_ascii=False, indent=1) + ");\n"
(ROOT / "alifba" / "js" / "lines_letters.js").write_text(out, encoding="utf-8")
print(len(L), "реплик")
