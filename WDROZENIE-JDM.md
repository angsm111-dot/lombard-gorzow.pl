# Publikacja na JDM

Docelowo: poprawka w Codexie → sprawdzenie → commit i push do GitHuba → automatyczna publikacja na JDM.

Stan: nowa strona jest przygotowana do hostingu statycznego, ale dostęp do JDM nie został skonfigurowany. Domena nadal obsługuje starą stronę WordPress.

Do konfiguracji potrzebne są: dostępny protokół (SFTP/SSH lub FTPS), host i port, użytkownik oraz dokładny katalog domeny. Hasło lub klucz należy skonfigurować jako sekret, nigdy jako treść pliku w repozytorium. Po ustaleniu protokołu można dodać wdrażanie z GitHub Actions po push do main, z blokadą równoległych publikacji.

## Pierwsza podmiana

1. Sprawdź katalog domeny i konfigurację HTTPS. Użytkownik ma już kopię na serwerze i nie chce kolejnej — wykorzystaj istniejącą kopię do ewentualnego przywrócenia; ustal jej lokalizację.
2. Spisz stare adresy podstron i dopasuj przekierowania 301. Nie przekierowuj wszystkich starych adresów na stronę główną.
3. Zbuduj i sprawdź witrynę: `python3 scripts/export.py` oraz `python3 -m unittest discover -s tests -q`. Przed publikacją odśwież snapshot poleceniem `python3 scripts/update_prices.py`.
4. Wgraj zawartość `dist/lombard-gorzow.zip` do osobnego katalogu testowego. Sprawdź HTML, obrazy, menu mobilne, kalkulator, cenniki, HTTPS i kontakt. Formularz wyceny pozostaje demonstracyjny — nie wysyła wiadomości.
5. Przełącz katalog domeny na nową wersję, jeżeli panel na to pozwala; w przeciwnym razie zaplanuj bezpieczną podmianę z wykorzystaniem istniejącej kopii. Stare reguły WordPressa w `.htaccess` nie mogą przechwytywać nowych adresów. Nie zmieniaj rekordów poczty ani innych domen.
6. Sprawdź publiczną stronę po wdrożeniu i zapisz wdrożony commit oraz sposób powrotu. GitHub Pages pozostaje osobnym podglądem z noindex; na JDM publikuj paczkę produkcyjną z eksportu.

## Kolejne aktualizacje

Publikuj wyłącznie pliki z eksportu, nie całe repozytorium. Nie usuwaj nieznanych plików hostingu ani katalogów innych usług. Raportuj osobno wynik push do GitHuba i wynik wdrożenia na JDM. Nie ogłaszaj sukcesu wdrożenia przed potwierdzeniem publikacji.
