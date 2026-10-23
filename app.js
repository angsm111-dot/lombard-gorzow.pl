// Formularz demonstracyjny nie wysyła danych do serwera.
document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#result').textContent = 'Zapytanie przygotowane. To demonstracja — dane nie zostały wysłane.';
});

// Publiczny cennik tego samego Workera, który obsługuje panel SEZAM.
// Odczytujemy gotową cenę skupu, bez ponownego naliczania potrąceń.
const GOLD_PRICES_URL = 'https://skup-zlota-gorzow.angsm111.workers.dev/api/prices';
const priceBody = document.querySelector('#gold-price-rows');
const priceStatus = document.querySelector('#gold-price-status');
const refreshPricesButton = document.querySelector('#refresh-gold-prices');
const pln = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let pricesLoading = false;

function showPriceMessage(message) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 2;
  cell.className = 'price-message';
  cell.textContent = message;
  row.append(cell);
  priceBody.replaceChildren(row);
}

async function refreshGoldPrices() {
  if (pricesLoading) return;
  pricesLoading = true;
  refreshPricesButton.disabled = true;
  priceBody.setAttribute('aria-busy', 'true');
  priceStatus.textContent = priceBody.dataset.hasPrices === 'true' ? 'Odświeżanie cen… Ostatnie notowania: ' + priceBody.dataset.snapshotDate + '.' : 'Pobieranie aktualnego cennika…';
  try {
    const response = await fetch(GOLD_PRICES_URL, {
      mode: 'cors', credentials: 'omit', cache: 'no-store',
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error('Nie udało się pobrać cennika');
    const data = await response.json();
    const purities = data?.metals?.gold?.purities;
    if (data?.status !== 'ok' || !purities || typeof purities !== 'object' || Array.isArray(purities)) {
      throw new Error('Nieprawidłowa odpowiedź cennika');
    }
    const entries = Object.entries(purities).sort(([a], [b]) => Number(a) - Number(b));
    if (!entries.length || entries.some(([purity, value]) =>
      !/^\d{3}$/.test(purity) || Number(purity) < 1 || Number(purity) > 999 ||
      typeof value?.price !== 'number' || !Number.isFinite(value.price) || value.price < 0
    )) throw new Error('Nieprawidłowe ceny');
    const rows = entries.map(([purity, value]) => {
      const row = document.createElement('tr');
      const label = document.createElement('th');
      label.scope = 'row';
      label.textContent = purity;
      const fraction = document.createElement('span');
      fraction.textContent = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 }).format(Number(purity) / 10) + '% złota';
      label.append(' ', fraction);
      const price = document.createElement('td');
      price.textContent = pln.format(value.price) + ' zł/g';
      row.append(label, price);
      return row;
    });
    priceBody.replaceChildren(...rows);
    priceBody.dataset.hasPrices = 'true';
    const fetchedAt = new Date(data.fetchedAt);
    const marketDate = Number.isFinite(fetchedAt.getTime())
      ? ' · Notowania: ' + new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Warsaw' }).format(fetchedAt)
      : '';
    priceBody.dataset.snapshotDate = Number.isFinite(fetchedAt.getTime()) ? new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Warsaw' }).format(fetchedAt) : 'data niepodana';
    priceStatus.textContent = 'Ceny skupu z panelu SEZAM · PLN za 1 g' + marketDate + '. Odświeżanie co minutę.';
    priceStatus.dataset.state = 'ready';
  } catch {
    if (priceBody.dataset.hasPrices === 'true') {
      priceStatus.textContent = 'Nie potwierdzono aktualności cen. Pokazujemy ostatnio pobrany cennik · notowania: ' + priceBody.dataset.snapshotDate + '. Zadzwoń, aby potwierdzić cenę.';
    } else {
      showPriceMessage('Ceny chwilowo niedostępne');
      priceStatus.textContent = 'Nie można pobrać aktualnego cennika. Odśwież lub zapytaj nas o cenę przez WhatsApp.';
    }
    priceStatus.dataset.state = 'error';
  } finally {
    priceBody.setAttribute('aria-busy', 'false');
    pricesLoading = false;
    refreshPricesButton.disabled = false;
  }
}
refreshPricesButton.addEventListener('click', refreshGoldPrices);
refreshGoldPrices();
setInterval(() => { if (!document.hidden) refreshGoldPrices(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshGoldPrices(); });


// Stawki zgodne z kalkulatorem sezam.com.pl/kalkulator-oplat/:
// zakres 50–100 000 PLN; 2,5%/15 dni, 5%/30 dni (odczyt 24.10.2026).
const feeAmount = document.querySelector('#fee-amount');
const feeRange = document.querySelector('#fee-range');
const feeError = document.querySelector('#fee-error');
const feeResults = document.querySelector('#fee-results');
const feeMoney = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
function calculateFee() {
  const amount = feeAmount.valueAsNumber;
  const valid = feeAmount.value !== '' && Number.isFinite(amount) && feeAmount.validity.valid;
  feeAmount.setAttribute('aria-invalid', String(!valid));
  feeResults.hidden = !valid;
  feeError.textContent = valid ? '' : 'Podaj kwotę od 50 do 100 000 zł, z dokładnością do grosza.';
  document.querySelectorAll('[data-fee-amount]').forEach(button => {
    button.setAttribute('aria-pressed', String(valid && Number(button.dataset.feeAmount) === amount));
  });
  if (!valid) return;
  feeRange.value = amount;
  const days = Number(document.querySelector('[name="fee-period"]:checked').value);
  const cents = Math.round(amount * 100);
  const feeCents = Math.round(cents * (days === 15 ? 25 : 50) / 1000);
  document.querySelector('#fee-days').textContent = days;
  document.querySelector('#fee-cost').textContent = feeMoney.format(feeCents / 100);
  document.querySelector('#fee-total').textContent = feeMoney.format((cents + feeCents) / 100);
}
feeAmount.addEventListener('input', calculateFee);
feeRange.addEventListener('input', () => { feeAmount.value = feeRange.value; calculateFee(); });
document.querySelectorAll('[name="fee-period"]').forEach(input => input.addEventListener('change', calculateFee));
document.querySelectorAll('[data-fee-amount]').forEach(button => button.addEventListener('click', () => {
  feeAmount.value = button.dataset.feeAmount;
  calculateFee();
}));
calculateFee();
