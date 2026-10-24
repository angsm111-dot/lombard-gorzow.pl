# Lombard Sezam — lombard-gorzow.pl

Lekka, wielostronicowa strona statyczna. Zawiera 15 osobnych plików HTML z treścią dostępną bez JavaScript. Domena docelowa: https://lombard-gorzow.pl. Hosting JDM nadal obsługuje obecną witrynę; nie zmienialiśmy hostingu, DNS ani poczty.

## Uruchomienie i kontynuacja pracy

Repozytorium: `angsm111-dot/lombard-gorzow.pl`, gałąź `main`. Używaj istniejącego checkoutu w izolowanym środowisku chmurowym; nie twórz Git worktree bez prośby użytkownika.

```sh
python3 scripts/build_site.py
python3 -m http.server 5173 --bind 0.0.0.0
```

Python jest potrzebny tylko do lokalnego serwera i generowania plików. Hosting produkcyjny wymaga jedynie obsługi statycznych HTML/CSS/JS i obrazów. Nie ma zależności npm ani frameworka. Proces serwera trzeba uruchomić ponownie w nowej sesji.

## Co edytować

- `content/site.json`: źródło wspólnego nagłówka, stopki, sekcji i czterech artykułów. **Nie edytuj wygenerowanych HTML jako źródła** — następny build je zastąpi.
- `scripts/build_site.py`: struktura podstron, ich tytuły, opisy, canonical i generowanie mapy witryny.
- `style.css`: wspólne style, responsywność i natywne menu mobilne.
- `app.js`: tylko wspólne menu i demonstracyjny formularz.
- `calculator.js`: kalkulator opłat, ładowany wyłącznie na stronie kalkulatora.
- `prices.js`: odczyt publicznych cen, ładowany wyłącznie w czterech cennikach.
- `prices-snapshot.json`: ostatnio pobrane rzeczywiste ceny wszystkich metali z datą notowań.
- `assets/`: lokalne WebP i logo PNG. Zdjęcia są fotorealistycznymi ilustracjami AI, nie dokumentacją produktów czy lokalu firmy.

Po zmianach źródeł uruchom `python3 scripts/build_site.py`, a potem sprawdź wynik. Wygenerowane HTML są śledzone w Git, więc hosting nie musi uruchamiać generatora.

## Adresy stron

- `/` — strona główna z jasnym zdjęciem i informacją o promocji;
- `/co-przyjmujemy.html` — złoto i srebro, telefony/laptopy, elektronarzędzia, rowery i inne przedmioty;
- `/na-sprzedaz.html` — przycisk OLX do profilu z sezam.com.pl;
- `/cennik.html` — wybór metalu;
- `/cennik-zlota.html`, `/cennik-srebra.html`, `/cennik-platyny.html`, `/cennik-palladu.html` — osobne cenniki z przełącznikiem metali;
- `/kalkulator-oplat.html` — opłaty 2,5% / 15 dni i 5% / 30 dni;
- `/kontakt.html` — adres, dojazd, telefon, WhatsApp i demonstracyjny formularz;
- `/blog.html` — spis czterech artykułów;
- `/blog/co-przyjmujemy-do-lombardu.html`;
- `/blog/ile-warte-jest-zloto.html`;
- `/blog/telefon-laptop-przed-sprzedaza.html`;
- `/blog/swieta-bozego-narodzenia-2027.html`.

Każda strona ma jeden H1, własny title, description i canonical. Artykuły mają pełną treść w HTML i dane strukturalne BlogPosting. `sitemap.xml` obejmuje wszystkie 15 stron, a `robots.txt` podaje jej adres. Nie ma routingu wyłącznie po hashach ani wymogu JavaScript do indeksowania treści. Rozdzielenie adresów nie gwarantuje wyższej pozycji; ważne są też jakość treści i rzeczywista publikacja.

## Ceny z panelu SEZAM

Panel: https://skup-zlota-gorzow.angsm111.workers.dev/admin

Repozytorium panelu: https://github.com/angsm111-dot/nowa-skup-zlota-gorzow

Publiczny odczyt: https://skup-zlota-gorzow.angsm111.workers.dev/api/prices

Cenniki odczytują `metals[gold|silver|platinum|palladium].purities[próba].price` w PLN/g. Stawki już uwzględniają ustawienia panelu — nie doliczamy potrąceń ponownie. Nie są potrzebne hasła ani klucze administratora. API zwraca publiczny CORS `Access-Control-Allow-Origin: *`.

```sh
python3 scripts/update_prices.py
```

Polecenie pobiera i sprawdza wszystkie cztery cenniki z weryfikacją TLS, zapisuje snapshot i regeneruje HTML. Przy błędzie nie zapisuje nieprawidłowych danych. Odśwież snapshot przed wdrożeniem.

W przeglądarce cennik odświeża się po otwarciu, co minutę w widocznej karcie, po powrocie do karty i przyciskiem. Podczas błędu zachowuje ostatnie ceny z datą i ostrzeżeniem o braku potwierdzenia aktualności. Bez JS przełączanie metali działa przez normalne linki HTML, a ceny są widoczne z datą pobrania. Brylanty mają nieaktywny przycisk „w budowie”, bez wymyślonych stawek.

Produkcyjne API zostało odczytane przez curl z weryfikacją TLS. Bezpośredni fetch w Chromium środowiska chmurowego wcześniej blokował certyfikat lokalnego proxy (`ERR_CERT_AUTHORITY_INVALID`). Test przeglądarkowy używa prawidłowej odpowiedzi snapshotu i nie dowodzi bezpośredniego połączenia z API na hostingu JDM. Należy je zweryfikować po wdrożeniu.

## Kalkulator i kontakt

Stawki z kalkulatora sezam.com.pl (odczyt 24.10.2026): 50–100 000 zł, 2,5% / 15 dni i 5% / 30 dni. Domyślnie 15 dni. Opłata jest zaokrąglana do grosza, a suma zawiera kwotę i opłatę. Stawki są zapisane w kodzie, niezależnie od cennika metali. Dynamiczne przeliczanie wymaga JavaScript; w podglądzie blokującym skrypty wyświetlana jest odpowiednia informacja.

Adres: ul. Pocztowa 11, 66-400 Gorzów Wielkopolski. Telefon i WhatsApp: +48 601 775 146. „Zadzwoń” znajduje się nad WhatsAppem. W stopce są sezam.com.pl, srebrogorzow.pl i zlotogorzow.pl.

OLX: https://www.olx.pl/oferty/uzytkownik/G2XGE/ — sprawdzony w zakładce https://sezam.com.pl/oferta-olx-allegro/.

Logo: https://sezam.com.pl/wp-content/uploads/2021/04/SezamLombard_logoRGB-1.png.

## Szybkość

Brak zewnętrznych fontów, bibliotek UI, trackerów i frameworka. Wspólne CSS/JS są współdzielone między podstronami. Wersje skryptów i CSS są oznaczone skrótem zawartości. Zdjęcia mają wymiary i WebP; te niżej na stronie są ładowane leniwie. Cena jest pobierana tylko na cenniku, nie na głównej i w artykułach. `.htaccess` zawiera opcjonalną kompresję i cache dla Apache/LiteSpeed. Ostateczna szybkość zależy również od konfiguracji JDM i wymaga pomiaru po publikacji.

## Kontrole

```sh
python3 scripts/build_site.py
python3 -m unittest discover -s tests -v
node --check app.js
node --check prices.js
node --check calculator.js
```

Opcjonalnie, po uruchomieniu serwera i z dostępnym Playwright/Chromium:

```sh
SITE_URL=http://127.0.0.1:5173/ node tests/browser.cjs
```

Test przyjmuje `PLAYWRIGHT_MODULE` jako ścieżkę do dostępnego modułu oraz `CHROMIUM_PATH` jako ścieżkę do przeglądarki. Sprawdza 15 stron przy 320/390/768/1440 px, menu, metalowe cenniki, zmianę ceny panelu, błędy sieci, kalkulator, blog i tryb bez JS.

## Paczka do hostingu / podglądu

```sh
python3 scripts/export.py
```

Wynik: `dist/lombard-gorzow.zip`. To kompletna wielostronicowa witryna, a nie pojedynczy plik HTML. Archiwum obejmuje wszystkie podstrony, używane grafiki, CSS, JS, mapę witryny, robots.txt i `.htaccess`, bez plików źródłowych panelu czy sekretów. Rozpakuj i otwórz przez lokalny serwer albo wgraj zawartość do katalogu domeny na hostingu.

Przed wdrożeniem: kopia istniejącej strony JDM, zachowanie ustawień poczty, potwierdzenie API, uzupełnienie godzin otwarcia oraz podłączenie obsługi formularza i informacji o przetwarzaniu danych. Formularz obecnie niczego nie wysyła. Strona nie została opublikowana przez zapis do repozytorium.

## Podgląd GitHub Pages

Gałąź `gh-pages` zawiera gotową kopię statycznej witryny do podglądu, z `noindex` i `.nojekyll`. Nie zmienia domeny lombard-gorzow.pl ani strony na JDM. Aby ją udostępnić, w GitHub → Settings → Pages wybierz „Deploy from a branch”, gałąź `gh-pages`, katalog `/(root)` i zapisz. Oczekiwany adres po zakończeniu wdrożenia: https://angsm111-dot.github.io/lombard-gorzow.pl/ . Samo wysłanie gałęzi nie potwierdza aktywacji Pages; konfiguracja przez GitHub API była blokowana przez sieć środowiska. Kolejne zmiany main wymagają odświeżenia kopii na gh-pages; nie ma automatycznej synchronizacji.
