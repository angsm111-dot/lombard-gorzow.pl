// Crawlable price pages enhanced with two-level, in-place mobile navigation.
(() => {
  const section = document.querySelector('[data-price-metal]');
  if (!section) return;
  const initial = JSON.parse(document.querySelector('#metal-price-snapshot').textContent);
  const views = initial.views;
  const tabs = section.querySelector('.metal-tabs');
  const kindTabs = section.querySelector('.kind-tabs');
  const controls = section.querySelector('.price-controls');
  const intro = document.querySelector('.page-intro');
  const panel = section.querySelector('.gold-prices');
  const body = document.querySelector('#price-rows');
  const status = document.querySelector('#price-status');
  const refreshButton = document.querySelector('#refresh-prices');
  const list = document.querySelector('#product-price-list');
  const search = document.querySelector('#product-search');
  const more = document.querySelector('#product-more');
  const count = document.querySelector('#product-count');
  const money = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const number = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 4 });
  const date = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Warsaw' });
  let metal = section.dataset.priceMetal;
  let kind = section.dataset.priceKind || 'purity';
  let cached = initial;
  let visible = 12;
  let loading = false;
  let fresh = false;
  let failed = false;
  let purityHeight = kind === 'purity' ? panel.getBoundingClientRect().height : 0;
  intro.style.minHeight = intro.getBoundingClientRect().height + 'px';
  section.classList.add('price-enhanced');

  function purityEntries(data, key) {
    const purities = data?.metals?.[key]?.purities;
    if (!purities || typeof purities !== 'object' || Array.isArray(purities)) throw new Error('Invalid feed');
    const entries = Object.entries(purities).sort(([a], [b]) => Number(a) - Number(b));
    if (!entries.length || entries.some(([purity, item]) => !/^\d{3}$/.test(purity) || Number(purity) > 999 || Number(purity) < 1 || typeof item?.price !== 'number' || !Number.isFinite(item.price) || item.price < 0)) throw new Error('Invalid prices');
    return entries;
  }
  function productsFor(data, key, type) {
    const items = data?.products?.[key + (type === 'coins' ? 'Coins' : 'Bars')];
    if (!Array.isArray(items)) throw new Error('Missing catalog');
    const seen = new Set();
    return items.filter(item => item.active !== false).map((item, index) => {
      if (!item || typeof item.id !== 'string' || !item.id || seen.has(item.id) || typeof item.name !== 'string' || !item.name.trim() || item.metal !== key || item.kind !== (type === 'coins' ? 'coin' : 'bar')) throw new Error('Invalid product');
      if (['price', 'grossWeight', 'purity'].some(field => typeof item[field] !== 'number' || !Number.isFinite(item[field]) || item[field] < 0) || item.grossWeight <= 0 || item.purity <= 0 || item.purity > 1000) throw new Error('Invalid product price');
      seen.add(item.id);
      return { ...item, position: Number.isFinite(item.order) ? item.order : index };
    }).sort((a, b) => a.position - b.position);
  }
  function normalized(text) {
    return String(text).toLocaleLowerCase('pl').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ł/g, 'l').replace(/,/g, '.').replace(/\s+/g, '');
  }
  function matches(item, query) {
    const weight = query.trim().match(/^(\d+(?:[.,]\d+)?)\s*g$/i);
    if (weight) return Math.abs(item.grossWeight - Number(weight[1].replace(',', '.'))) < 0.005;
    return normalized(item.name + ' ' + number.format(item.grossWeight) + ' g').includes(normalized(query));
  }
  function updateStatus() {
    const fetched = new Date(cached.fetchedAt);
    const stamp = Number.isFinite(fetched.getTime()) ? date.format(fetched) : 'data niepodana';
    body.dataset.snapshotDate = stamp;
    if (fresh) {
      status.textContent = 'Notowania: ' + stamp + ' · ' + (kind === 'purity' ? 'Ceny za 1 gram.' : 'Ceny za 1 sztukę.') + ' Odświeżanie co minutę.';
      status.dataset.state = 'ready';
    } else {
      status.textContent = (failed ? 'Nie potwierdzono aktualności cen. ' : '') + 'Ostatnio pobrany cennik · notowania: ' + stamp + '. Aktualność potwierdzisz telefonicznie.';
      status.dataset.state = failed ? 'error' : 'snapshot';
    }
  }
  function renderProducts() {
    const items = productsFor(cached, metal, kind).filter(item => matches(item, search.value));
    const shown = items.slice(0, visible);
    const nodes = shown.map(item => {
      const row = document.createElement('article');
      row.className = 'product-price-row';
      row.setAttribute('role', 'listitem');
      row.dataset.productId = item.id;
      const info = document.createElement('div');
      const name = document.createElement('h3');
      name.textContent = item.name;
      const parameters = document.createElement('p');
      parameters.textContent = number.format(item.grossWeight) + ' g · próba ' + number.format(item.purity);
      info.append(name, parameters);
      const price = document.createElement('p');
      price.className = 'product-buy-price';
      const amount = document.createElement('strong');
      amount.textContent = money.format(item.price) + ' zł';
      const unit = document.createElement('small');
      unit.textContent = 'za 1 sztukę';
      price.append(amount, unit);
      row.append(info, price);
      return row;
    });
    if (!nodes.length) {
      const message = document.createElement('p');
      message.className = 'product-empty';
      message.textContent = 'Brak pasujących pozycji. Zmień wyszukiwanie lub zapytaj nas o wycenę.';
      nodes.push(message);
    }
    list.replaceChildren(...nodes);
    count.textContent = 'Wyświetlono ' + shown.length + ' z ' + items.length + ' produktów · ceny za 1 sztukę';
    more.hidden = shown.length >= items.length;
    more.textContent = 'Pokaż kolejne (' + Math.min(12, items.length - shown.length) + ')';
  }
  function render() {
    const view = views[metal + '/' + kind];
    section.dataset.priceMetal = metal;
    section.dataset.priceKind = kind;
    section.querySelector('.purity-view').hidden = kind !== 'purity';
    section.querySelector('.products-view').hidden = kind === 'purity';
    section.querySelector('.jewelry-premium').hidden = kind !== 'purity';
    panel.style.minHeight = '';
    if (kind === 'purity') {
      const rows = purityEntries(cached, metal).map(([purity, item]) => {
        const row = document.createElement('tr');
        const label = document.createElement('th');
        label.scope = 'row';
        label.textContent = purity + ' ';
        const percent = document.createElement('span');
        percent.textContent = number.format(Number(purity) / 10) + '% metalu';
        label.append(percent);
        const price = document.createElement('td');
        price.textContent = money.format(item.price) + ' zł/g';
        row.append(label, price);
        return row;
      });
      body.replaceChildren(...rows);
      section.querySelector('caption').textContent = view.caption;
      purityHeight = Math.max(purityHeight, panel.getBoundingClientRect().height);
      panel.style.minHeight = purityHeight + 'px';
    } else {
      document.querySelector('#product-caption').textContent = view.caption;
      search.placeholder = kind === 'coins' ? 'Np. Krugerrand, Liść Klonowy, 1/10 oz' : 'Np. 1 g, 10 g, 1 uncja';
      renderProducts();
    }
    tabs.querySelectorAll('a').forEach(link => {
      const key = link.dataset.metal;
      const nextKind = views[key + '/' + kind] ? kind : 'purity';
      link.href = views[key + '/' + nextKind].route;
      if (key === metal) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    kindTabs.hidden = !views[metal + '/coins'];
    const links = ['purity', 'coins', 'bars'].filter(type => views[metal + '/' + type]).map(type => {
      const link = document.createElement('a');
      link.dataset.kind = type;
      link.href = views[metal + '/' + type].route;
      link.textContent = { purity: 'Według próby', coins: 'Monety', bars: 'Sztabki' }[type];
      if (type === kind) link.setAttribute('aria-current', 'page');
      return link;
    });
    kindTabs.replaceChildren(...links);
    updateStatus();
  }
  function changeView(nextMetal, nextKind, push) {
    const view = views[nextMetal + '/' + nextKind];
    if (!view || (nextMetal === metal && nextKind === kind)) return;
    if (nextKind === 'purity') purityEntries(cached, nextMetal);
    else productsFor(cached, nextMetal, nextKind);
    const top = tabs.getBoundingClientRect().top;
    metal = nextMetal;
    kind = nextKind;
    search.value = '';
    visible = 12;
    render();
    intro.querySelector('h1').textContent = view.heading;
    intro.querySelector('p').textContent = view.intro;
    const reading = document.querySelector('.reading-section');
    reading.querySelector('h2').textContent = view.readingTitle;
    reading.querySelectorAll(':scope > p').forEach((p, i) => { p.textContent = view.reading[i]; });
    document.title = view.title;
    document.querySelector('link[rel="canonical"]').href = 'https://lombard-gorzow.pl/' + view.route;
    document.querySelector('meta[property="og:url"]').content = 'https://lombard-gorzow.pl/' + view.route;
    document.querySelector('meta[property="og:title"]').content = view.title;
    document.querySelector('meta[name="description"]').content = view.description;
    document.querySelector('meta[property="og:description"]').content = view.description;
    if (push) { try { history.pushState({ metal, kind }, '', view.route); } catch { /* Local previews may restrict history. */ } }
    window.scrollTo({ top: window.scrollY + tabs.getBoundingClientRect().top - top, behavior: 'instant' });
  }
  controls.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const view = Object.values(views).find(view => new URL(link.href).pathname.endsWith('/' + view.route));
    if (!view) return;
    try {
      if (view.kind === 'purity') purityEntries(cached, view.metal);
      else productsFor(cached, view.metal, view.kind);
      event.preventDefault();
      changeView(view.metal, view.kind, true);
    } catch { /* Ordinary links remain a fallback. */ }
  });
  search.addEventListener('input', () => { visible = 12; renderProducts(); });
  more.addEventListener('click', () => { visible += 12; renderProducts(); });
  window.addEventListener('popstate', () => {
    const view = Object.values(views).find(view => location.pathname.endsWith('/' + view.route)) || views['gold/purity'];
    changeView(view.metal, view.kind, false);
  });
  async function refresh() {
    if (loading) return;
    loading = true;
    refreshButton.disabled = true;
    body.setAttribute('aria-busy', 'true');
    list.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('https://skup-zlota-gorzow.angsm111.workers.dev/api/prices', { credentials: 'omit', mode: 'cors', cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('HTTP error');
      const data = await response.json();
      if (data.status !== 'ok') throw new Error('Invalid feed');
      ['gold', 'silver', 'platinum', 'palladium'].forEach(key => purityEntries(data, key));
      for (const key of ['gold', 'silver']) for (const type of ['coins', 'bars']) productsFor(data, key, type);
      cached = data;
      fresh = true;
      failed = false;
      render();
    } catch { fresh = false; failed = true; updateStatus(); }
    finally { loading = false; refreshButton.disabled = false; body.setAttribute('aria-busy', 'false'); list.setAttribute('aria-busy', 'false'); }
  }
  refreshButton.addEventListener('click', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  render();
  refresh();
})();
