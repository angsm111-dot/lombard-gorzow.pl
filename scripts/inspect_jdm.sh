#!/usr/bin/env bash
set -eu
# Zdalny odczyt nazw i katalogów. Bez odczytu wp-config, haseł lub baz.
printf 'Katalog początkowy: '
pwd -P
printf '\nKatalog domowy: %s\n' "$HOME"
printf '\nRsync: '
if command -v rsync >/dev/null 2>&1; then printf 'dostępny\n'; else printf 'brak — potrzebny transport SFTP\n'; fi
printf '\nKatalogi na pierwszym poziomie:\n'
find "$HOME" -mindepth 1 -maxdepth 1 -type d ! -name '.*' -print 2>/dev/null
printf '\nZnalezione katalogi WordPressa (obecność wp-load.php i wp-includes):\n'
find "$HOME" -maxdepth 6 \( -type d \( -name '.*' -o -name node_modules -o -name cache \) -prune \) -o \
  \( -type f -name wp-load.php -print \) 2>/dev/null |
while IFS= read -r file; do
  directory=${file%/*}
  if [ -d "$directory/wp-includes" ]; then printf '%s\n' "$directory"; fi
done
printf '\nTypowe katalogi WWW i dowiązania (tylko nazwy i cele):\n'
for directory in "$HOME/public_html" "$HOME/www" "$HOME/htdocs" "$HOME/domains"; do
  if [ -e "$directory" ]; then ls -ld "$directory"; fi
done
printf '\nZakończono odczyt. Żadne pliki strony nie zostały zmienione.\n'
