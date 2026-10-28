# Praca i publikacja

- Użytkownik zleca poprawki w Codexie. Po ich wykonaniu sprawdź stronę, zrób commit i wyślij zmiany do GitHuba.
- Docelowy proces: po poprawnym sprawdzeniu zmian publikuj również na JDM, pod domeną lombard-gorzow.pl. Użytkownik upoważnił do tego procesu; nie pytaj ponownie o zgodę na każdą aktualizację.
- Automatyczna publikacja JDM jest włączona w `.github/workflows/deploy-jdm.yml` po każdym push main (można zatrzymać zmienną JDM_DEPLOY_ENABLED=false). SSH web16.jdm.pl:2233, użytkownik lombardg, katalog /home/lombardg/public_html; rsync potwierdzony. Hasło: sekret JDM_PASSWORD. Publiczny klucz serwera przekazany przez użytkownika przypięty w config/jdm_known_hosts. Na wyraźne polecenie użytkownika brak SSL nie blokuje wysyłki; kontrola publikacji korzysta tymczasowo z HTTP (zwykła weryfikacja TLS pozostaje aktywna, jeśli serwer przekieruje na HTTPS); wynik wdrożenia wymaga potwierdzenia w Actions. Nie przedstawiaj samego push jako potwierdzonej publikacji na JDM.
- Użytkownik potwierdził, że ma już kopię na serwerze i nie chce kolejnej. Nie twórz dodatkowej kopii. Przed pierwszą podmianą ustal katalog domeny i lokalizację istniejącej kopii do ewentualnego przywrócenia. Zachowaj ustawienia poczty i DNS.
- Dostęp do hostingu przechowuj wyłącznie w sekretach. Nie zapisuj haseł ani prywatnych kluczy w repozytorium lub logach. Publiczny klucz tożsamości hosta SSH jest jawny i może być wersjonowany. Protokół i sposób automatyzacji dobierz po potwierdzeniu możliwości hostingu.
- Źródła i polecenia budowania opisano w README.md. Nie edytuj wygenerowanych HTML jako źródeł.

- Wdrożenie produkcyjne potwierdzone: commit df07bd7, run 40712444102. Domena główna wyświetla nową statyczną stronę; HTTP przekierowuje na HTTPS, certyfikat przeszedł kontrolę klienta Actions.
- JDM preferował index.php nad index.html. Rozpoznany start WordPressa przeniesiono (bez kopiowania) do /home/lombardg/.codex-wordpress-index.php poza public_html. Nie przywracaj go podczas zwykłych aktualizacji. Dane i reszta plików WordPressa pozostały.
- Wyniki każdej publikacji wracają automatycznie na gałąź jdm-status, plik jdm-status.json. Odczytuj je przez git fetch origin refs/heads/jdm-status:refs/remotes/origin/jdm-status oraz git show origin/jdm-status:jdm-status.json. Sprawdzaj commit, status i publiczne potwierdzenie, nie sam kolor workflow.
- Workflow wymaga bash z pipefail; tee nie może maskować błędów. .htaccess jest wysyłany pod nazwą roboczą i przenoszony atomowo, ponieważ bezpośredni rsync do .htaccess na JDM powodował błędy weryfikacji.
