# Publikacja na JDM

Strona produkcyjna: https://lombard-gorzow.pl/. Pierwsze poprawne wdrożenie potwierdzone przez publiczną domenę: df07bd7, GitHub Actions run 40712444102. HTTP przekierowuje na HTTPS i weryfikacja certyfikatu w Actions przeszła poprawnie. Nie potwierdzono wersji www.

## Automatyczne aktualizacje

Zmiana w Codexie → build i sprawdzenie → commit i push main → `.github/workflows/deploy-jdm.yml` → wysyłka tar przez SSH na JDM → kontrola publicznego numeru wdrożenia i nowej strony głównej.

SSH: web16.jdm.pl:2233, użytkownik lombardg, katalog `/home/lombardg/public_html`. Hasło pozostaje sekretem GitHub `JDM_PASSWORD`; publiczny klucz hosta przypięto w `config/jdm_known_hosts`. Wyłączenie automatu: zmienna repozytorium `JDM_DEPLOY_ENABLED=false`. Ręczne ponowienie: Actions → Publikacja JDM → Run workflow na main.

Każdy wynik wraca na gałąź `jdm-status`, plik `jdm-status.json`. Zawiera commit, numer uruchomienia, wyniki kroków i diagnostykę publicznych adresów. Codex może odczytać go przez git bez proszenia o zrzuty ekranu. Sukces wymaga zgodnego numeru wdrożenia i treści nowej strony głównej. Wszystkie polecenia workflow używają bash z pipefail, więc tee nie maskuje błędów.

## Migracja WordPressa

JDM preferował stary index.php mimo DirectoryIndex w .htaccess. Skrypt po kompletnym przesłaniu strony przeniósł rozpoznany start WordPressa do `/home/lombardg/.codex-wordpress-index.php`, poza katalog publiczny. Nie tworzono dodatkowej kopii; użytkownik ma już kopię na serwerze. Nie usuwano bazy ani pozostałych plików WordPressa. Nie zmieniano DNS, poczty i innych domen.

Przywrócenie starego startu wymaga świadomego odtworzenia index.php i reguł WordPressa z istniejącej kopii. Nie wykonuj tego podczas zwykłych aktualizacji. Nieznany index.php zatrzymuje automat zamiast zostać przeniesiony.

Bezpośredni rsync do .htaccess powodował na JDM błąd weryfikacji. Plik jest teraz przesyłany pod nazwą roboczą i atomowo przenoszony po wysyłce. Skrypt nie używa --delete i nie tworzy katalogu docelowego. Eksport zawiera tylko statyczną witrynę. Formularz wyceny nadal jest demonstracyjny i niczego nie wysyła.

GitHub Pages pozostaje osobnym podglądem z noindex. Produkcja pochodzi z `scripts/export.py`. Nie ma blokady wdrażania na oczekiwanie na SSL (wyraźna decyzja użytkownika); publiczne sprawdzenie korzysta z HTTP i respektuje przekierowania, z normalną weryfikacją TLS.

Aktualizacja: rsync powodował błędy weryfikacji blog.html. Transport korzysta teraz z tar przez SSH i porównania SHA-256 wszystkich plików eksportu; nie zmieniono zasad weryfikacji tożsamości SSH. Artykuł o skupie monet srebrnych dodano z tekstem około 2000 znaków i fotografią poglądową.

## Przerwa techniczna

`config/maintenance.json`: `enabled=true` oznacza komunikat na wszystkich 20 generowanych podstronach produkcji; `enabled=false` przywraca pełną witrynę przy następnym push. Użytkownik włączył przerwę, aby dalej poprawiać stronę. Nie wyłączaj jej przy zwykłych poprawkach.

`scripts/maintenance.py` zmienia wyłącznie rozpakowany eksport w dist/public po sprawdzeniu właściwej witryny. Oryginalne HTML, artykuły i podgląd GitHub Pages pozostają pełne. Logo i telefon są dostępne na komunikacie. Weryfikator sprawdza komunikat dla wszystkich wygenerowanych adresów. Nie dotyczy to pozostałych starych plików WordPressa na hostingu. Komunikat jest statycznym HTML z noindex; nie zwraca HTTP 503 (wymagałoby to reguł serwera), więc tryb jest przeznaczony na krótką przerwę.

## Usunięcie starej instalacji WordPressa

Na osobne polecenie użytkownika usunięto rozpoznane pliki i katalogi WordPressa oraz 59 jego tabel. Potwierdzenie końcowe: cleanup f1268be, run 40721575628. Plik startowy przeniesiony wcześniej poza public_html również skasowano. Konta bazy i sam kontener bazy nie były usuwane; nie było innych tabel w tej bazie.

Istniejące kopie wp-content-old oraz .htaccess.bk przeniesiono bez kopiowania do `/home/lombardg/.existing-wordpress-backups` poza WWW. Chronione przez hosting pliki mu-pluginu JDM i object-cache.php nie mogły zostać usunięte przez konto SSH — po skasowaniu reszty wp-content przeniesiono ich pozostałości do `/home/lombardg/.jdm-managed-wordpress-remnants`. Nie są dostępne przez stronę.

Workflow `.github/workflows/wordpress-cleanup.yml` służy do odczytu lub celowego czyszczenia. Po operacji `config/wordpress-cleanup.json` przywrócono do audit. Wyniki wracają na gałąź wordpress-cleanup-status do jdm-status.json. Zwykłe publikacje nie uruchamiają kasowania WordPressa.
