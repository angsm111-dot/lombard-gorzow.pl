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
  feeAmount.setAttribute('aria-describedby', valid ? 'fee-results' : 'fee-error');
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


