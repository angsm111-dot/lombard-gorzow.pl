#!/usr/bin/env python3
"""Update the already-configured gh-pages preview, without touching JDM or DNS."""
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(root / 'scripts/export.py')], cwd=root, check=True)
remote = subprocess.check_output(['git', 'remote', 'get-url', 'origin'], cwd=root, text=True).strip()
identity = subprocess.check_output(['git', 'var', 'GIT_AUTHOR_IDENT'], cwd=root, text=True).strip()
author = re.match(r'(.*?) <(.*?)>', identity)
if not author:
    raise SystemExit('Git author is not configured')
with tempfile.TemporaryDirectory(prefix='lombard-preview-', dir='/tmp') as temp:
    destination = Path(temp) / 'site'
    subprocess.run(['git', 'clone', '--depth', '1', '--branch', 'gh-pages', remote, str(destination)], check=True)
    subprocess.run(['git', 'config', 'user.name', author.group(1)], cwd=destination, check=True)
    subprocess.run(['git', 'config', 'user.email', author.group(2)], cwd=destination, check=True)
    subprocess.run(['git', 'rm', '-r', '--ignore-unmatch', '.'], cwd=destination, check=True, stdout=subprocess.DEVNULL)
    with zipfile.ZipFile(root / 'dist/lombard-gorzow.zip') as archive:
        archive.extractall(destination)
    for page in destination.rglob('*.html'):
        page.write_text(page.read_text().replace('<meta name="viewport"', '<meta name="robots" content="noindex, nofollow"><meta name="viewport"', 1))
    (destination / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')
    (destination / '.nojekyll').write_text('')
    (destination / 'WDROZENIE.txt').unlink(missing_ok=True)
    subprocess.run(['git', 'add', '.'], cwd=destination, check=True)
    changed = subprocess.run(['git', 'diff', '--cached', '--quiet'], cwd=destination)
    if changed.returncode == 1:
        subprocess.run(['git', 'commit', '-m', 'Update Lombard Sezam preview'], cwd=destination, check=True)
        subprocess.run(['git', 'push', 'origin', 'gh-pages'], cwd=destination, check=True)
    elif changed.returncode != 0:
        raise SystemExit('Unable to check preview diff')
print('Preview branch updated: https://angsm111-dot.github.io/lombard-gorzow.pl/')
print('GitHub Pages may need a moment to publish the new commit.')
