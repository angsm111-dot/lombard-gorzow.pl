#!/usr/bin/env bash
set -euo pipefail

# Wyłącznie eksport statyczny. Nie usuwamy WordPressa ani cudzych plików.
: "${JDM_HOST:?}" "${JDM_PORT:?}" "${JDM_USER:?}" "${JDM_PATH:?}" "${SSHPASS:?}"
test -f dist/public/index.html
test -f dist/public/.htaccess
ssh_options=(-p "$JDM_PORT" -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o ServerAliveInterval=15)
destination="${JDM_USER}@${JDM_HOST}"

# Nie zgadujemy ani nie tworzymy docelowego katalogu domeny.
sshpass -e ssh "${ssh_options[@]}" "$destination" "test -d '$JDM_PATH' && command -v rsync >/dev/null"
export RSYNC_RSH="sshpass -e ssh -p $JDM_PORT -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o ServerAliveInterval=15"
rsync -rt --delay-updates --chmod=D755,F644 \
  --exclude='.htaccess' --exclude='deployment-version.txt' \
  dist/public/ "$destination:$JDM_PATH/"
# JDM może zmieniać .htaccess podczas zapisu, co psuje weryfikację rsync.
# Przesyłamy pod nazwą roboczą, potem atomowo podstawiamy gotowy plik.
rsync -rt --chmod=F644 dist/public/.htaccess "$destination:$JDM_PATH/.codex-static-htaccess"
sshpass -e ssh "${ssh_options[@]}" "$destination" "mv '$JDM_PATH/.codex-static-htaccess' '$JDM_PATH/.htaccess'"
rsync -rt --chmod=F644 dist/public/deployment-version.txt "$destination:$JDM_PATH/"
# Serwer JDM preferuje index.php mimo DirectoryIndex. Wyłączamy wyłącznie
# rozpoznany start WordPressa, po kompletnym przesłaniu statycznej strony.
# To przeniesienie poza public_html, nie dodatkowa kopia ani usuwanie danych WP.
sshpass -e ssh "${ssh_options[@]}" "$destination" "bash -s" <<'REMOTE'
set -euo pipefail
cd /home/lombardg/public_html
test -s index.html
if [ -f index.php ]; then
  grep -q 'wp-blog-header.php' index.php || { echo 'Nieznany index.php — nie zmieniono go.'; exit 1; }
  test ! -e ../.codex-wordpress-index.php || { echo 'Plik docelowy wyłączenia WordPressa już istnieje — zatrzymano podmianę.'; exit 1; }
  mv index.php ../.codex-wordpress-index.php
  echo 'Wyłączono start WordPressa; index.html jest teraz stroną główną.'
fi
REMOTE
