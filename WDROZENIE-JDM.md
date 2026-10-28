# Publikacja na JDM

Docelowo: poprawka w Codexie → sprawdzenie → commit i push do GitHuba → automatyczna publikacja na JDM.

Stan: nowa strona jest przygotowana do hostingu statycznego, ale dostęp do JDM nie został skonfigurowany. Domena nadal obsługuje starą stronę WordPress.

Do konfiguracji potrzebne są: dostępny protokół (SFTP/SSH lub FTPS), host i port, użytkownik oraz dokładny katalog domeny. Hasło lub klucz należy skonfigurować jako sekret, nigdy jako treść pliku w repozytorium. Dostęp potwierdzony w panelu: SSH/SFTP, host `web16.jdm.pl`, port `2233`, login `lombardg`. Przygotowano GitHub Actions po push do main z blokadą równoległych publikacji; workflow jest włączony po przekazaniu przez użytkownika klucza hosta i potwierdzeniu katalogu.

## Pierwsza podmiana

1. Sprawdź katalog domeny i konfigurację HTTPS. Użytkownik ma już kopię na serwerze i nie chce kolejnej — wykorzystaj istniejącą kopię do ewentualnego przywrócenia; ustal jej lokalizację.
2. Spisz stare adresy podstron i dopasuj przekierowania 301. Nie przekierowuj wszystkich starych adresów na stronę główną.
3. Zbuduj i sprawdź witrynę: `python3 scripts/export.py` oraz `python3 -m unittest discover -s tests -q`. Przed publikacją odśwież snapshot poleceniem `python3 scripts/update_prices.py`.
4. Wgraj zawartość `dist/lombard-gorzow.zip` do osobnego katalogu testowego. Sprawdź HTML, obrazy, menu mobilne, kalkulator, cenniki, HTTPS i kontakt. Formularz wyceny pozostaje demonstracyjny — nie wysyła wiadomości.
5. Przełącz katalog domeny na nową wersję, jeżeli panel na to pozwala; w przeciwnym razie zaplanuj bezpieczną podmianę z wykorzystaniem istniejącej kopii. Stare reguły WordPressa w `.htaccess` nie mogą przechwytywać nowych adresów. Nie zmieniaj rekordów poczty ani innych domen.
6. Sprawdź publiczną stronę po wdrożeniu i zapisz wdrożony commit oraz sposób powrotu. GitHub Pages pozostaje osobnym podglądem z noindex; na JDM publikuj paczkę produkcyjną z eksportu.

## Kolejne aktualizacje

Publikuj wyłącznie pliki z eksportu, nie całe repozytorium. Nie usuwaj nieznanych plików hostingu ani katalogów innych usług. Raportuj osobno wynik push do GitHuba i wynik wdrożenia na JDM. Nie ogłaszaj sukcesu wdrożenia przed potwierdzeniem publikacji.

## Jednorazowa konfiguracja automatu

Workflow: `.github/workflows/deploy-jdm.yml`; przesyłanie: `scripts/deploy_jdm.sh`.

Konfiguracja jest już gotowa:

- Hasło SSH: sekret repozytorium `JDM_PASSWORD` (użytkownik potwierdził dodanie).
- Publiczny klucz hosta przekazany przez użytkownika: `config/jdm_known_hosts`. Zweryfikowano, że przekazany wpis haszowany dotyczy `[web16.jdm.pl]:2233`. Klucz pochodzi z pierwszego udanego połączenia, nie z niezależnej weryfikacji u operatora.
- Katalog docelowy: `/home/lombardg/public_html`, potwierdzony diagnostyką SSH.
- Każdy push main uruchamia publikację. Nie trzeba dodawać kolejnych sekretów ani zmiennych. Opcjonalna zmienna `JDM_DEPLOY_ENABLED=false` zatrzymuje publikację.
- Ręczne uruchomienie lub ponowienie: Actions → Publikacja JDM → Run workflow na main.
- Kontrola HTTPS przed wysyłką zatrzymuje publikację, jeśli certyfikat lub dostęp do domeny nie działa; aktywuj SSL w JDM i ponów workflow.

Serwer musi udostępniać polecenie `rsync` przez SSH; automat sprawdza to przed wysyłką. Gdy serwer nie obsługuje rsync, dostosuj transport do SFTP przed aktywacją. Skrypt nie tworzy katalogu docelowego i nie używa `--delete`; wysyła tylko eksport, `.htaccess` na końcu. Nie robi kolejnej kopii. Stary WordPress nie jest automatycznie usuwany — po podmianie jego pozostałe adresy i pliki trzeba uporządkować zgodnie z ustaloną migracją. Przesyłanie poszczególnych plików jest atomowe, cała witryna nie jest przełączana atomowo.

Workflow kończy się sukcesem dopiero po odczytaniu numeru wdrożonego commita i nowego nagłówka z publicznej domeny HTTPS. Nie wystarczy samo przesłanie plików. Nieudana walidacja cen lub strony zatrzymuje publikację przed połączeniem z hostingiem.

Potwierdzenie z diagnostyki SSH: katalog początkowy i domowy `/home/lombardg`; WordPress w `/home/lombardg/public_html`; rsync dostępny. Publiczny klucz hosta odczytany podczas pierwszego połączenia jest w Summary workflow „Sprawdź połączenie JDM”. Można go przypiąć przez JDM_KNOWN_HOSTS dla kolejnych połączeń; jest to kontynuacja pierwszego zaufania, nie niezależna weryfikacja JDM.
