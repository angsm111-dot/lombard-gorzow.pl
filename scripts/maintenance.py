#!/usr/bin/env python3
"""Replace only the production export with a reversible maintenance notice."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def apply(directory):
    pages = json.loads((ROOT / 'site-manifest.json').read_text())['pages']
    for name in pages:
        prefix = '../' if '/' in name else ''
        notice = f'''<!doctype html>
<html lang="pl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow"><meta name="maintenance" content="active">
<title>Przerwa techniczna — Lombard Sezam Gorzów</title>
<style>*{{box-sizing:border-box}}body{{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#fbf7ef;color:#263449;font:17px/1.7 Arial,sans-serif}}main{{width:100%;max-width:620px;text-align:center;background:white;border:1px solid #e8e1d6;border-radius:18px;padding:clamp(28px,6vw,60px)}}img{{width:100%;max-width:310px;height:auto}}h1{{font:normal clamp(30px,7vw,44px)/1.2 Georgia,serif;color:#622139;margin:32px 0 20px}}p{{margin:0 0 24px}}a{{display:inline-block;background:#263449;color:white;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold}}small{{display:block;margin-top:20px;color:#645e56}}</style></head>
<body><main><img src="{prefix}assets/sezam-logo.png" alt="Lombard Sezam" width="2033" height="313"><h1>Przerwa techniczna</h1><p>Pracujemy nad naszą stroną.<br>Zapraszamy ponownie wkrótce.</p><a href="tel:+48601775146">Zadzwoń: 601 775 146</a><small>ul. Pocztowa 11, Gorzów Wielkopolski</small></main></body></html>'''
        (directory / name).write_text(notice)
    print(f'Przerwa techniczna: zastąpiono {len(pages)} stron wyłącznie w eksporcie produkcyjnym.')


if __name__ == '__main__':
    if json.loads((ROOT / 'config/maintenance.json').read_text())['enabled']:
        apply(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist/public')
    else:
        print('Przerwa techniczna wyłączona — publikacja pełnej strony.')
