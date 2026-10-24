// Public buy prices are already adjusted in the admin panel. Static URLs still
// work without JS; enhanced tabs update the table in place, without a reload.
(() => {
  const section = document.querySelector('[data-price-metal]');
  if (!section) return;
  const body = document.querySelector('#price-rows');
  const status = document.querySelector('#price-status');
  const button = document.querySelector('#refresh-prices');
  const tabs = section.querySelector('.metal-tabs');
  const intro = document.querySelector('.page-intro');
  const panel = section.querySelector('.gold-prices');
  const metals = {
    gold: { name: 'złota', route: 'cennik-zlota.html' },
    silver: { name: 'srebra', route: 'cennik-srebra.html' },
    platinum: { name: 'platyny', route: 'cennik-platyny.html' },
    palladium: { name: 'palladu', route: 'cennik-palladu.html' }
  };
  const money = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fraction = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Warsaw' });
  let metal = section.dataset.priceMetal;
  let cached = JSON.parse(document.querySelector('#metal-price-snapshot').textContent);
  let loading = false;
  let fresh = false;
  let failed = false;
  let maximumPanelHeight = panel.getBoundingClientRect().height;
  panel.style.minHeight = maximumPanelHeight + 'px';
  intro.style.minHeight = intro.getBoundingClientRect().height + 'px';

  function entriesFor(data, key) {
    const purities = data?.metals?.[key]?.purities;
    if (!purities || typeof purities !== 'object' || Array.isArray(purities)) throw new Error('Invalid feed');
    const entries = Object.entries(purities).sort(([a], [b]) => Number(a) - Number(b));
    if (!entries.length || entries.some(([purity, item]) => !/^\d{3}$/.test(purity) || Number(purity) > 999 || Number(purity) < 1 || typeof item?.price !== 'number' || !Number.isFinite(item.price) || item.price < 0)) throw new Error('Invalid prices');
    return entries;
  }
  function updateStatus() {
    const stamp = body.dataset.snapshotDate;
    if (fresh) {
      status.textContent = 'Ceny skupu · PLN za 1 g · Notowania: ' + stamp + '. Odświeżanie co minutę.';
      status.dataset.state = 'ready';
    } else {
      status.textContent = (failed ? 'Nie potwierdzono aktualności cen. ' : '') + 'Ostatnio pobrany cennik · notowania: ' + stamp + '. Aktualność potwierdzisz telefonicznie.';
      status.dataset.state = failed ? 'error' : 'snapshot';
    }
  }
  function render() {
    const rows = entriesFor(cached, metal).map(([purity, item]) => {
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
    const fetched = new Date(cached.fetchedAt);
    body.dataset.snapshotDate = Number.isFinite(fetched.getTime()) ? date.format(fetched) : 'data niepodana';
    section.dataset.priceMetal = metal;
    section.querySelector('caption').textContent = 'Ceny skupu ' + metals[metal].name + ' za 1 gram';
    tabs.querySelectorAll('a').forEach(link => {
      if (new URL(link.href).pathname.endsWith('/' + metals[metal].route)) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    updateStatus();
    maximumPanelHeight = Math.max(maximumPanelHeight, panel.getBoundingClientRect().height);
    panel.style.minHeight = maximumPanelHeight + 'px';
  }
  function switchMetal(next, push) {
    if (!metals[next] || next === metal) return;
    entriesFor(cached, next); // Validate before changing any visible state.
    const anchorTop = tabs.getBoundingClientRect().top;
    metal = next;
    render();
    const name = metals[metal].name;
    intro.querySelector('h1').textContent = 'Skup ' + name + ' w Gorzowie — cennik';
    intro.querySelector('p').textContent = 'Sprawdź ceny skupu ' + name + ' według próby. Kwoty podano w złotych za jeden gram metalu. Podane stawki uwzględniają ustawienia cennika Sezam.';
    const readingTitle = document.querySelector('.reading-section h2');
    if (readingTitle) readingTitle.textContent = 'Jak sprawdzić wartość ' + name + '?';
    document.title = 'Skup ' + name + ' Gorzów — ceny za gram | Lombard Sezam';
    const canonical = 'https://lombard-gorzow.pl/' + metals[metal].route;
    document.querySelector('link[rel="canonical"]').href = canonical;
    document.querySelector('meta[property="og:url"]').content = canonical;
    document.querySelector('meta[property="og:title"]').content = document.title;
    const description = 'Cennik skupu ' + name + ' w Gorzowie Wielkopolskim. Ceny za gram dla poszczególnych prób z panelu Sezam. Wycena przy ul. Pocztowej 11.';
    document.querySelector('meta[name="description"]').content = description;
    document.querySelector('meta[property="og:description"]').content = description;
    if (push) {
      try { history.pushState({ metal }, '', metals[metal].route); } catch { /* Local HTML previews may restrict history. */ }
    }
    // Keep the controls at exactly the same viewport position, including when
    // the page title wraps differently. Reserve panel height for shorter tables.
    const targetScroll = window.scrollY + tabs.getBoundingClientRect().top - anchorTop;
    window.scrollTo({ top: targetScroll, behavior: 'instant' });
  }
  tabs.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const next = Object.keys(metals).find(key => new URL(link.href).pathname.endsWith('/' + metals[key].route));
    if (!next) return;
    try {
      entriesFor(cached, next);
      event.preventDefault();
      switchMetal(next, true);
    } catch { /* Keep ordinary link navigation if data is unavailable. */ }
  });
  window.addEventListener('popstate', () => {
    const key = Object.keys(metals).find(key => location.pathname.endsWith('/' + metals[key].route)) || 'gold';
    switchMetal(key, false);
  });
  async function refresh() {
    if (loading) return;
    loading = true;
    button.disabled = true;
    body.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('https://skup-zlota-gorzow.angsm111.workers.dev/api/prices', {
        credentials: 'omit', mode: 'cors', cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) throw new Error('HTTP error');
      const data = await response.json();
      if (data.status !== 'ok') throw new Error('Invalid feed');
      Object.keys(metals).forEach(key => entriesFor(data, key));
      cached = data;
      fresh = true;
      failed = false;
      render();
    } catch {
      fresh = false;
      failed = true;
      updateStatus();
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
