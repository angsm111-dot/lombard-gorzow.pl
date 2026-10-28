#!/usr/bin/env bash
set -euo pipefail

# Wyłącznie eksport statyczny. Nie usuwamy WordPressa ani cudzych plików.
: "${JDM_HOST:?}" "${JDM_PORT:?}" "${JDM_USER:?}" "${JDM_PATH:?}" "${SSHPASS:?}"
test -f dist/public/index.html
test -f dist/public/.htaccess
ssh_options=(-p "$JDM_PORT" -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o ServerAliveInterval=15)
destination="${JDM_USER}@${JDM_HOST}"

# Nie zgadujemy ani nie tworzymy docelowego katalogu domeny.
sshpass -e ssh "${ssh_options[@]}" "$destination" "test -d '$JDM_PATH' && command -v tar >/dev/null && command -v sha256sum >/dev/null"
# Pełny strumień zamiast zawodnego na tym hostingu transferu różnicowego rsync.
tar -czf - --exclude=./.htaccess --exclude=./deployment-version.txt -C dist/public . |
  sshpass -e ssh "${ssh_options[@]}" "$destination" "umask 022; tar -xzf - -C '$JDM_PATH' --no-same-owner --no-same-permissions"
# Potwierdź zawartość każdego wysłanego pliku przed oznaczeniem wdrożenia.
python3 - <<'CHECKSUMS' | sshpass -e ssh "${ssh_options[@]}" "$destination" "cd '$JDM_PATH' && sha256sum --check --status -"
import hashlib
from pathlib import Path
root = Path('dist/public')
for path in sorted(root.rglob('*')):
    if path.is_file() and path.name not in ('.htaccess', 'deployment-version.txt'):
        print(hashlib.sha256(path.read_bytes()).hexdigest() + '  ' + path.relative_to(root).as_posix())
CHECKSUMS
# Reguły i numer wersji podstawiamy po poprawnym sprawdzeniu zawartości.
sshpass -e ssh "${ssh_options[@]}" "$destination" "cat > '$JDM_PATH/.codex-static-htaccess' && chmod 644 '$JDM_PATH/.codex-static-htaccess' && mv '$JDM_PATH/.codex-static-htaccess' '$JDM_PATH/.htaccess'" < dist/public/.htaccess
sshpass -e ssh "${ssh_options[@]}" "$destination" "cat > '$JDM_PATH/.codex-deployment-version' && chmod 644 '$JDM_PATH/.codex-deployment-version' && mv '$JDM_PATH/.codex-deployment-version' '$JDM_PATH/deployment-version.txt'" < dist/public/deployment-version.txt
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
