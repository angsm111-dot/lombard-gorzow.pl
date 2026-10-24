#!/usr/bin/env python3
"""Fetch all four public buy-price tables, then regenerate the static pages."""
import json
import math
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent.parent
url = 'https://skup-zlota-gorzow.angsm111.workers.dev/api/prices'
response = subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location', '--max-time', '25', '-H', 'Accept: application/json', url], check=True, capture_output=True, text=True)
data = json.loads(response.stdout)
if data.get('status') != 'ok':
    raise ValueError('Price feed is not ready')
metals = {}
for key in ('gold', 'silver', 'platinum', 'palladium'):
    prices = data['metals'][key]['purities']
    if not isinstance(prices, dict) or not prices:
        raise ValueError('Missing metal: ' + key)
    for purity, item in prices.items():
        price = item['price']
        if not re.fullmatch(r'\d{3}', purity) or not 0 < int(purity) <= 999 or type(price) not in (int, float) or not math.isfinite(price) or price < 0:
            raise ValueError('Invalid price for ' + key + '/' + purity)
    metals[key] = {'purities': prices}
datetime.fromisoformat(data['fetchedAt'].replace('Z', '+00:00'))
snapshot = {'source': url, 'fetchedAt': data['fetchedAt'], 'savedAt': datetime.now(timezone.utc).isoformat(), 'metals': metals}
(root / 'prices-snapshot.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
subprocess.run([sys.executable, str(root / 'scripts/build_site.py')], check=True)
print('Saved validated prices for gold, silver, platinum and palladium.')
