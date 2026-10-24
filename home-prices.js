// A compact, read-only summary of the same buy prices as the full price pages.
(() => {
  const summary = document.querySelector('.home-price-summary');
  if (!summary) return;
  const status = summary.querySelector('[role="status"]');
  const targets = [['gold', '585'], ['silver', '925']];
  const number = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Warsaw' });
  let loading = false;
  async function refresh() {
    if (loading) return;
    loading = true;
    try {
      const response = await fetch('https://skup-zlota-gorzow.angsm111.workers.dev/api/prices', {
        mode: 'cors', credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) throw new Error('HTTP error');
      const data = await response.json();
      const values = targets.map(([metal, purity]) => data?.metals?.[metal]?.purities?.[purity]?.price);
      if (data.status !== 'ok' || values.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) throw new Error('Invalid prices');
      targets.forEach(([metal], i) => { summary.querySelector('[data-summary-price="' + metal + '"]').textContent = number.format(values[i]); });
      const fetchedAt = new Date(data.fetchedAt);
      summary.dataset.snapshotDate = Number.isFinite(fetchedAt.getTime()) ? date.format(fetchedAt) : 'data niepodana';
      status.textContent = 'Notowania: ' + summary.dataset.snapshotDate + ' · Ceny za 1 gram.';
      status.dataset.state = 'ready';
    } catch {
      status.textContent = 'Ostatnio pobrane ceny · notowania: ' + summary.dataset.snapshotDate + '. Aktualność potwierdzisz telefonicznie.';
      status.dataset.state = 'error';
    } finally { loading = false; }
  }
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
