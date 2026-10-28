#!/usr/bin/env python3
"""Build and package the complete multi-page site for static hosting."""
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(root / 'scripts/build_site.py')], check=True)
output = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'dist' / 'lombard-gorzow.zip'
if output.suffix != '.zip':
    raise SystemExit('The project has multiple pages. Choose a .zip output, not a single .html file.')
pages = json.loads((root / 'site-manifest.json').read_text())['pages']
files = set(pages + ['style.css', 'app.js', 'calculator.js', 'prices.js', 'home-prices.js', 'sitemap.xml', 'robots.txt', '.htaccess'])
files.update(path.name for path in root.glob('google*.html') if re.fullmatch(r'google[0-9a-f]+\.html', path.name))
for page in pages:
    for asset in re.findall(r'src="(?:\.\./)?(assets/[^"?]+)', (root / page).read_text()):
        files.add(asset)
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for filename in sorted(files):
        archive.write(root / filename, filename)
    archive.writestr('WDROZENIE.txt', 'Wgraj zawartość archiwum do katalogu domeny lombard-gorzow.pl na hostingu. Zachowaj katalogi assets i blog. Użytkownik ma już kopię starej strony na serwerze — nie twórz kolejnej. Zachowaj ustawienia poczty. Domena i hosting nie zostały zmienione przez przygotowanie archiwum. Formularz wyceny jest demonstracyjny. Podgląd lokalny: python3 -m http.server 5173.\n')
print(output, output.stat().st_size, 'bytes;', len(pages), 'HTML pages.')
