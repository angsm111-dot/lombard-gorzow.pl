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
# Reguły WordPressa zastępujemy dopiero po przesłaniu witryny.
rsync -rt --chmod=F644 dist/public/.htaccess "$destination:$JDM_PATH/"
rsync -rt --chmod=F644 dist/public/deployment-version.txt "$destination:$JDM_PATH/"
