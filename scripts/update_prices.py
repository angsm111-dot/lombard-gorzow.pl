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
products = {}
for group, metal, kind in [('goldCoins', 'gold', 'coin'), ('goldBars', 'gold', 'bar'), ('silverCoins', 'silver', 'coin'), ('silverBars', 'silver', 'bar')]:
    items = data.get('products', {}).get(group)
    if not isinstance(items, list):
        raise ValueError('Missing product group: ' + group)
    products[group] = []
    seen = set()
    for item in items:
        if item.get('active') is False:
            continue
        if not isinstance(item.get('id'), str) or not item['id'] or item['id'] in seen or not isinstance(item.get('name'), str) or not item['name'].strip():
            raise ValueError('Invalid product identity: ' + group)
        if item.get('metal') != metal or item.get('kind') != kind:
            raise ValueError('Invalid product type: ' + group)
        for field in ('price', 'grossWeight', 'purity'):
            value = item.get(field)
            if type(value) not in (int, float) or not math.isfinite(value) or value < 0:
                raise ValueError('Invalid product ' + field)
        if not 0 < item['purity'] <= 1000 or item['grossWeight'] <= 0:
            raise ValueError('Invalid product mass/purity')
        seen.add(item['id'])
        # Keep only price-list metadata, never inline image payloads.
        products[group].append({key: item[key] for key in ('id', 'name', 'metal', 'kind', 'purity', 'grossWeight', 'fineWeight', 'price', 'order', 'active') if key in item})

datetime.fromisoformat(data['fetchedAt'].replace('Z', '+00:00'))
snapshot = {'source': url, 'fetchedAt': data['fetchedAt'], 'savedAt': datetime.now(timezone.utc).isoformat(), 'metals': metals, 'products': products}
(root / 'prices-snapshot.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
subprocess.run([sys.executable, str(root / 'scripts/build_site.py')], check=True)
print('Saved validated prices for gold, silver, platinum and palladium.')
