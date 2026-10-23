#!/usr/bin/env python3
"""Save a validated public price snapshot and update the no-JS HTML fallback."""
import json
import re
from datetime import datetime
from pathlib import Path
import subprocess
from zoneinfo import ZoneInfo

root = Path(__file__).resolve().parent.parent
url = 'https://skup-zlota-gorzow.angsm111.workers.dev/api/prices'
response = subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location', '--max-time', '20', '-H', 'Accept: application/json', url], check=True, capture_output=True, text=True)
data = json.loads(response.stdout)
prices = data['metals']['gold']['purities']
assert data['status'] == 'ok' and isinstance(prices, dict) and prices
for purity, item in prices.items():
    assert re.fullmatch(r'\d{3}', purity) and 0 < int(purity) <= 999
    assert isinstance(item['price'], (int, float)) and 0 <= item['price'] < float('inf')
stamp = datetime.fromisoformat(data['fetchedAt'].replace('Z', '+00:00')).astimezone(ZoneInfo('Europe/Warsaw')).strftime('%d.%m.%Y, %H:%M')
rows = []
for purity, item in sorted(prices.items(), key=lambda pair: int(pair[0])):
    price = f"{item['price']:,.2f}".replace(',', ' ').replace('.', ',')
    fraction = f'{int(purity)/10:g}'.replace('.', ',')
    rows.append(f'<tr><th scope="row">{purity} <span>{fraction}% złota</span></th><td>{price} zł/g</td></tr>')
html = (root / 'index.html').read_text()
html, count = re.subn(r'<tbody id="gold-price-rows"[^>]*>.*?</tbody>', '<tbody id="gold-price-rows" aria-busy="false" data-has-prices="true">' + ''.join(rows) + '</tbody>', html, count=1)
assert count == 1
note = f'Ostatnio pobrany cennik · notowania: {stamp} (Polska). Aktualność cen potwierdzisz telefonicznie.'
html, count = re.subn(r'(<p class="price-note" id="gold-price-status"[^>]*>).*?(</p>)', lambda match: match[1] + note + match[2], html, count=1)
assert count == 1
html = re.sub(r'(<tbody id="gold-price-rows"[^>]*)(>)', lambda m: m[1] + f' data-snapshot-date="{stamp}"' + m[2] if 'data-snapshot-date=' not in m[1] else re.sub(r'data-snapshot-date="[^"]*"', f'data-snapshot-date="{stamp}"', m[1]) + m[2], html, count=1)
html = html.replace('Włącz JavaScript, aby zobaczyć aktualne ceny skupu złota.', 'Włącz JavaScript, aby odświeżać ceny automatycznie. Powyżej znajduje się ostatnio pobrany cennik z datą notowań.')
(root / 'index.html').write_text(html)
(root / 'prices-snapshot.json').write_text(json.dumps({'source': url, 'fetchedAt': data['fetchedAt'], 'savedAt': datetime.now().astimezone().isoformat(), 'purities': prices}, ensure_ascii=False, indent=2) + '\n')
print('Saved', len(prices), 'gold prices; market data:', stamp)
