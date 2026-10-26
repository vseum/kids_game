#!/bin/sh
# Копирует игры в репозиторий сайта razumus.ru (папка igra/). Запуск: sh tools/publish.sh ../razumus
set -e
SITE="${1:-../razumus}"
cd "$(dirname "$0")/.."
rm -rf "$SITE/igra"
mkdir -p "$SITE/igra"
cp -r index.html oferta.html zapis.html zapis.json css js fonts voice alifba fonar "$SITE/igra/"
echo "Игра скопирована в $SITE/igra"
