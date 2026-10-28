# Praca i publikacja

- Użytkownik zleca poprawki w Codexie. Po ich wykonaniu sprawdź stronę, zrób commit i wyślij zmiany do GitHuba.
- Docelowy proces: po poprawnym sprawdzeniu zmian publikuj również na JDM, pod domeną lombard-gorzow.pl. Użytkownik upoważnił do tego procesu; nie pytaj ponownie o zgodę na każdą aktualizację.
- Automatyczna publikacja JDM jest włączona w `.github/workflows/deploy-jdm.yml` po każdym push main (można zatrzymać zmienną JDM_DEPLOY_ENABLED=false). SSH web16.jdm.pl:2233, użytkownik lombardg, katalog /home/lombardg/public_html; rsync potwierdzony. Hasło: sekret JDM_PASSWORD. Publiczny klucz serwera przekazany przez użytkownika przypięty w config/jdm_known_hosts. Na wyraźne polecenie użytkownika brak SSL nie blokuje wysyłki; kontrola publikacji korzysta tymczasowo z HTTP (zwykła weryfikacja TLS pozostaje aktywna, jeśli serwer przekieruje na HTTPS); wynik wdrożenia wymaga potwierdzenia w Actions. Nie przedstawiaj samego push jako potwierdzonej publikacji na JDM.
- Użytkownik potwierdził, że ma już kopię na serwerze i nie chce kolejnej. Nie twórz dodatkowej kopii. Przed pierwszą podmianą ustal katalog domeny i lokalizację istniejącej kopii do ewentualnego przywrócenia. Zachowaj ustawienia poczty i DNS.
- Dostęp do hostingu przechowuj wyłącznie w sekretach. Nie zapisuj haseł ani prywatnych kluczy w repozytorium lub logach. Publiczny klucz tożsamości hosta SSH jest jawny i może być wersjonowany. Protokół i sposób automatyzacji dobierz po potwierdzeniu możliwości hostingu.
- Źródła i polecenia budowania opisano w README.md. Nie edytuj wygenerowanych HTML jako źródeł.

- Wdrożenie produkcyjne potwierdzone: commit df07bd7, run 40712444102. Domena główna wyświetla nową statyczną stronę; HTTP przekierowuje na HTTPS, certyfikat przeszedł kontrolę klienta Actions.
- JDM preferował index.php nad index.html. Rozpoznany start WordPressa przeniesiono (bez kopiowania) do /home/lombardg/.codex-wordpress-index.php poza public_html. Nie przywracaj go podczas zwykłych aktualizacji. Historyczny stan migracji; później użytkownik polecił pełne usunięcie WordPressa — patrz aktualizacja poniżej.
- Wyniki każdej publikacji wracają automatycznie na gałąź jdm-status, plik jdm-status.json. Odczytuj je przez git fetch origin refs/heads/jdm-status:refs/remotes/origin/jdm-status oraz git show origin/jdm-status:jdm-status.json. Sprawdzaj commit, status i publiczne potwierdzenie, nie sam kolor workflow.
- Workflow wymaga bash z pipefail; tee nie może maskować błędów. .htaccess jest wysyłany pod nazwą roboczą i przenoszony atomowo, ponieważ bezpośredni rsync do .htaccess na JDM powodował błędy weryfikacji.

- Transport zmieniony z rsync na pełny strumień tar przez SSH, ponieważ rsync zwracał błędy weryfikacji również dla blog.html. SHA-256 każdego pliku eksportu jest kontrolowane na serwerze przed zapisaniem numeru wdrożenia. Reguły .htaccess i numer wdrożenia podstawiane są przez pliki robocze.

- Przerwa techniczna: użytkownik polecił ją wyłączyć; config/maintenance.json ma enabled=false. Workflow nakłada komunikat na wszystkie HTML w dist/public, pozostawiając pełne źródła i GitHub Pages do podglądu. Kolejne poprawki mają zachować obecny stan przerwy. Nie włączaj jej ponownie bez polecenia użytkownika. Weryfikacja publiczna sprawdza wtedy odpowiedni tryb.

- WordPress usunięty na wyraźne polecenie użytkownika. Potwierdzony cleanup commit f1268be, run 40721575628: brak wp-admin, wp-includes, wp-content, wp-config.php, wp-login.php, xmlrpc.php i pozostałych rozpoznanych plików WordPressa w public_html. Usunięto 59 tabel tej instalacji, bez kasowania innych baz i kont.
- Istniejące wp-content-old i .htaccess.bk przeniesiono (nie kopiowano) do /home/lombardg/.existing-wordpress-backups poza WWW. Nie usuwaj kopii użytkownika.
- Pliki dodatku JDM i object-cache.php są chronione przez hosting i nie dawały się skasować. Pozostałości przeniesiono do /home/lombardg/.jdm-managed-wordpress-remnants poza WWW; nie są dostępne przez stronę. Nie twierdź, że fizycznie usunięto je z całego serwera.
- Dawny /home/lombardg/.codex-wordpress-index.php również skasowano. Nie przywracaj WordPressa. Stan cleanup dostępny na gałęzi wordpress-cleanup-status (jdm-status.json). Zadanie cleanup przywrócono do trybu audit po zakończonej operacji; tryb remove wymaga nowego zadania obejmującego usuwanie.

- Na prośbę użytkownika formularz mailowy jest wyłączony (brak formularza w kontakcie). Monety i sztabki złote mają comingSoon=true w generatorze, nieaktywne zakładki „W budowie” i strony bez list produktów; JS respektuje ten stan i nie przywraca cen po odświeżeniu. Nie włączaj ich przy zwykłych aktualizacjach. Srebro i złoto według próby pozostają aktywne.

- Artykuły mają stałe pole published w formacie YYYY-MM-DD w content/site.json, widoczne na liście i w artykule oraz jako datePublished w BlogPosting. Nowym artykułom nadawaj rzeczywistą datę publikacji; nie zmieniaj daty istniejącego wpisu przy zwykłych poprawkach.

- Cennik ma teraz natywną listę wyboru metalu oraz osobne opcje Na wagę / Monety / Sztabki z objaśnieniami. Bez JS pozostają zwykłe linki do metali. Włączenie złotych produktów w przyszłości jest przewidziane przez flagę comingSoon; snapshot i walidacja grup dostosowują się do flag. Nie włączaj ich bez polecenia użytkownika.

- Kalkulator: kwoty skrótów obejmują 10 000, 40 000, 60 000, 80 000 i 100 000 zł. Dla poprawnej kwoty >=40 000 zł pokazuje komunikat „Opłaty do negocjacji”, także przy wpisywaniu ręcznym i suwaku; niższa lub nieprawidłowa kwota ukrywa komunikat. Komunikat nie zmienia samodzielnie stawek procentowych.

- Plik Google Search Console google357c00f8ea992a8f.html musi pozostawać w katalogu głównym i w każdym eksporcie, bez zmiany nazwy ani treści. Nie dodawaj do niego szablonu HTML, metadanych ani przerwy technicznej. Eksport automatycznie obejmuje pliki google<hex>.html; weryfikator JDM sprawdza ich treść pod publicznym adresem bez parametru cache.

- Wspólny szablon dodaje pływający przycisk WhatsApp w prawym dolnym rogu na mobile i desktopie. Karta kontaktu ma nagłówek KONTAKT bez osobnej ikony WhatsApp nad przyciskami. Menu: Cennik skupu metali szlachetnych. Kalkulator ma kolejność DOM: kwota → gotowe kwoty → suwak → okres → komunikat negocjacji → wynik. Zachowaj tę kolejność i działanie powiadomienia od 40 000 zł.

- Pełny cennik odświeża ceny co 5 minut. Timer przy caption liczy do faktycznego odświeżenia, resetuje się po próbie, przy błędzie mówi o ponownej próbie; bez JS jest ukryty. Nie wracaj do interwału minutowego bez zmiany timera. Strona główna zachowuje własne odświeżanie home-prices.js.

- Suwak kalkulatora używa 151 pozycji mapowanych na kwoty: 50 zł, 100–2000 zł co 100, 2200–10000 zł co 200, 11000–100000 zł co 1000. Pozycje 0–150 nie oznaczają bezpośrednio kwoty. Pole ręczne nadal przyjmuje dokładną kwotę z groszami; aria-valuetext suwaka podaje złote.
