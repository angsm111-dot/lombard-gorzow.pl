// Read-only public prices; admin settings are already included in each buy price.
(() => {
  const section = document.querySelector('[data-price-metal]');
  if (!section) return;
  const metal = section.dataset.priceMetal;
  const body = document.querySelector('#price-rows');
  const status = document.querySelector('#price-status');
  const button = document.querySelector('#refresh-prices');
  const money = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fraction = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Warsaw' });
  let loading = false;
  async function refresh() {
    if (loading) return;
    loading = true;
    button.disabled = true;
    body.setAttribute('aria-busy', 'true');
    status.textContent = 'Odświeżanie cen… Ostatnie notowania: ' + body.dataset.snapshotDate + '.';
    try {
      const response = await fetch('https://skup-zlota-gorzow.angsm111.workers.dev/api/prices', {
        credentials: 'omit', mode: 'cors', cache: 'no-store', headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) throw new Error('HTTP error');
      const data = await response.json();
      const purities = data?.metals?.[metal]?.purities;
      if (data.status !== 'ok' || !purities || typeof purities !== 'object' || Array.isArray(purities)) throw new Error('Invalid feed');
      const entries = Object.entries(purities).sort(([a], [b]) => Number(a) - Number(b));
      if (!entries.length || entries.some(([purity, item]) => !/^\d{3}$/.test(purity) || Number(purity) > 999 || Number(purity) < 1 || typeof item?.price !== 'number' || !Number.isFinite(item.price) || item.price < 0)) throw new Error('Invalid prices');
      const rows = entries.map(([purity, item]) => {
        const row = document.createElement('tr');
        const label = document.createElement('th');
        label.scope = 'row';
        label.textContent = purity + ' ';
        const percent = document.createElement('span');
        percent.textContent = fraction.format(Number(purity) / 10) + '% metalu';
        label.append(percent);
        const price = document.createElement('td');
        price.textContent = money.format(item.price) + ' zł/g';
        row.append(label, price);
        return row;
      });
      body.replaceChildren(...rows);
      const fetched = new Date(data.fetchedAt);
      body.dataset.snapshotDate = Number.isFinite(fetched.getTime()) ? date.format(fetched) : 'data niepodana';
      status.textContent = 'Ceny skupu · PLN za 1 g · Notowania: ' + body.dataset.snapshotDate + '. Odświeżanie co minutę.';
      status.dataset.state = 'ready';
    } catch {
      status.textContent = 'Nie potwierdzono aktualności cen. Pokazujemy ostatnio pobrany cennik · notowania: ' + body.dataset.snapshotDate + '. Zadzwoń, aby potwierdzić cenę.';
      status.dataset.state = 'error';
    } finally {
      loading = false;
      button.disabled = false;
      body.setAttribute('aria-busy', 'false');
    }
  }
  button.addEventListener('click', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  refresh();
})();
