#!/usr/bin/env python3
"""Build a standalone HTML preview without third-party dependencies."""
import base64
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
output = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'dist' / 'lombard-gorzow.html'
html = (root / 'index.html').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + (root / 'style.css').read_text(encoding='utf-8') + '</style>')
html = html.replace('<script src="app.js"></script>', '<script>' + (root / 'app.js').read_text(encoding='utf-8') + '</script>')
for image in (root / 'assets').iterdir():
    if image.suffix not in ('.png', '.webp'):
        continue
    mime = 'image/webp' if image.suffix == '.webp' else 'image/png'
    encoded = base64.b64encode(image.read_bytes()).decode('ascii')
    html = html.replace(f'src="assets/{image.name}"', f'src="data:{mime};base64,{encoded}"')
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html, encoding='utf-8')
print(output)
