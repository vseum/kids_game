#!/bin/sh
# Копирует игру в репозиторий сайта рахмат.рус (папка igra/). Запуск: sh tools/publish.sh ../rahmat
set -e
SITE="${1:-../rahmat}"
cd "$(dirname "$0")/.."
rm -rf "$SITE/igra"
mkdir -p "$SITE/igra"
cp -r index.html oferta.html css js voice "$SITE/igra/"
echo "Игра скопирована в $SITE/igra"
