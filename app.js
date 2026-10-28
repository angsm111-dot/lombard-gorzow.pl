// Natywne details/summary otwiera menu także przy wyłączonym JavaScript.
const mobileMenu = document.querySelector('.mobile-navigation');
function closeMobileMenu(restoreFocus = false) {
  mobileMenu.open = false;
  if (restoreFocus) mobileMenu.querySelector('summary').focus();
}
mobileMenu.querySelector('nav').addEventListener('click', event => {
  if (event.target.closest('a')) closeMobileMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileMenu.open) closeMobileMenu(true);
});
document.addEventListener('click', event => {
  if (!mobileMenu.contains(event.target)) closeMobileMenu();
});
window.matchMedia('(max-width: 900px)').addEventListener('change', () => closeMobileMenu());
