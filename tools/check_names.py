#!/usr/bin/env python3
"""Проверка tools/names.tsv: Имя<TAB>Им+я<TAB>m|f|u."""
import re, sys, collections
path = sys.argv[1] if len(sys.argv) > 1 else 'tools/names.tsv'
VOWELS = set('аеёиоуыэюяАЕЁИОУЫЭЮЯ')
errors, seen, genders = [], {}, collections.Counter()
raw = open(path, 'rb').read()
if raw.startswith(b'\xef\xbb\xbf'): errors.append('файл с BOM')
for n, line in enumerate(raw.decode('utf-8').split('\n'), 1):
    if line == '': continue
    cols = line.split('\t')
    if len(cols) != 3: errors.append(f'{n}: колонок {len(cols)}: {line!r}'); continue
    name, stressed, g = cols
    if not re.fullmatch(r'[А-ЯЁ][а-яё]+(?:[- ][А-ЯЁа-яё][а-яё]+)*', name): errors.append(f'{n}: странное имя {name!r}')
    if stressed.count('+') != 1: errors.append(f'{n}: плюсов {stressed.count("+")}: {stressed}')
    else:
        i = stressed.index('+')
        if i + 1 >= len(stressed) or stressed[i + 1] not in VOWELS: errors.append(f'{n}: + не перед гласной: {stressed}')
    if stressed.replace('+', '') != name: errors.append(f'{n}: колонки 1 и 2 не совпадают: {name} / {stressed}')
    if 'ё' in name.lower() and '+ё' not in stressed.lower(): errors.append(f'{n}: ё без ударения: {stressed}')
    if g not in ('m', 'f', 'u'): errors.append(f'{n}: пол {g!r}')
    if name in seen: errors.append(f'{n}: дубль {name} (строка {seen[name]})')
    seen[name] = n; genders[g] += 1
if not raw.endswith(b'\n'): errors.append('нет перевода строки в конце')
print('\n'.join(errors) if errors else 'OK')
print(f'имён: {len(seen)}  m={genders["m"]} f={genders["f"]} u={genders["u"]}')
sys.exit(1 if errors else 0)
