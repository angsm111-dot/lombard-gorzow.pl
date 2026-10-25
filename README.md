# Lombard Sezam — lombard-gorzow.pl

Lekka, wielostronicowa strona statyczna. Zawiera 19 osobnych plików HTML z treścią dostępną bez JavaScript. Domena docelowa: https://lombard-gorzow.pl. Hosting JDM nadal obsługuje obecną witrynę; nie zmienialiśmy hostingu, DNS ani poczty.

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
- `home-prices.js`: lekki skrót cen złota 585 i srebra 925 wyłącznie na głównej.
- `prices-snapshot.json`: ostatnio pobrane rzeczywiste ceny wszystkich metali z datą notowań.
- `assets/`: lokalne WebP i logo PNG. Zdjęcia są fotorealistycznymi ilustracjami AI, nie dokumentacją produktów czy lokalu firmy.

Po zmianach źródeł uruchom `python3 scripts/build_site.py`, a potem sprawdź wynik. Wygenerowane HTML są śledzone w Git, więc hosting nie musi uruchamiać generatora.

## Adresy stron

- `/` — strona główna z jasnym zdjęciem i informacją o promocji;
- `/co-przyjmujemy.html` — złoto i srebro, telefony/laptopy, elektronarzędzia, rowery i inne przedmioty;
- `/na-sprzedaz.html` — przycisk OLX do profilu z sezam.com.pl;
- `/cennik.html` — od razu tabela złota i małe przyciski wyboru metalu;
- `/cennik-zlota.html`, `/cennik-srebra.html`, `/cennik-platyny.html`, `/cennik-palladu.html` — osobne cenniki z przełącznikiem metali;
- `/monety-zlote.html`, `/sztabki-zlote.html` — skup monet i sztabek złotych;
- `/monety-srebrne.html`, `/sztabki-srebrne.html` — skup monet i sztabek srebrnych;
- `/kalkulator-oplat.html` — opłaty 2,5% / 15 dni i 5% / 30 dni;
- `/kontakt.html` — adres, dojazd, telefon, WhatsApp i demonstracyjny formularz;
- `/blog.html` — spis czterech artykułów;
- `/blog/co-przyjmujemy-do-lombardu.html`;
- `/blog/ile-warte-jest-zloto.html`;
- `/blog/telefon-laptop-przed-sprzedaza.html`;
- `/blog/swieta-bozego-narodzenia-2027.html`.

Każda strona ma jeden H1, własny title, description i canonical. Artykuły mają pełną treść w HTML i dane strukturalne BlogPosting. `sitemap.xml` obejmuje 18 kanonicznych adresów (wejście `/cennik.html` wskazuje kanonicznie `/cennik-zlota.html`), a `robots.txt` podaje jej adres. Nie ma routingu wyłącznie po hashach ani wymogu JavaScript do indeksowania treści. Rozdzielenie adresów nie gwarantuje wyższej pozycji; ważne są też jakość treści i rzeczywista publikacja.

## Ceny z panelu SEZAM

Panel: https://skup-zlota-gorzow.angsm111.workers.dev/admin

Repozytorium panelu: https://github.com/angsm111-dot/nowa-skup-zlota-gorzow

Publiczny odczyt: https://skup-zlota-gorzow.angsm111.workers.dev/api/prices

Cenniki odczytują `metals[gold|silver|platinum|palladium].purities[próba].price` w PLN/g. Stawki już uwzględniają ustawienia panelu — nie doliczamy potrąceń ponownie. Nie są potrzebne hasła ani klucze administratora. API zwraca publiczny CORS `Access-Control-Allow-Origin: *`.

```sh
python3 scripts/update_prices.py
```

Polecenie pobiera i sprawdza wszystkie cztery cenniki oraz cztery katalogi monet i sztabek z weryfikacją TLS, zapisuje snapshot i regeneruje HTML. Przy błędzie nie zapisuje nieprawidłowych danych. Odśwież snapshot przed wdrożeniem.

W przeglądarce cennik odświeża się po otwarciu, co minutę w widocznej karcie, po powrocie do karty i przyciskiem. Podczas błędu zachowuje ostatnie ceny z datą i ostrzeżeniem o braku potwierdzenia aktualności. Przy włączonym JS metal zmienia się w miejscu, bez przeładowania i bez przesunięcia kontrolek; aktualizują się URL, tytuł i metadane. Działa Wstecz. Bez JS przełączanie metali nadal działa przez normalne linki HTML, a ceny są widoczne z datą pobrania. Brylanty zostały usunięte. Cztery metale są wyświetlane jako równe przyciski w jednym rzędzie. Nad tabelą jest wyróżniona informacja o wyższej cenie za biżuterię niż za złom i indywidualnej wycenie.

Produkcyjne API zostało odczytane przez curl z weryfikacją TLS. Bezpośredni fetch w Chromium środowiska chmurowego wcześniej blokował certyfikat lokalnego proxy (`ERR_CERT_AUTHORITY_INVALID`). Test przeglądarkowy używa prawidłowej odpowiedzi snapshotu i nie dowodzi bezpośredniego połączenia z API na hostingu JDM. Należy je zweryfikować po wdrożeniu.

## Kalkulator i kontakt

Stawki z kalkulatora sezam.com.pl (odczyt 24.10.2026): 50–100 000 zł, 2,5% / 15 dni i 5% / 30 dni. Domyślnie 15 dni. Opłata jest zaokrąglana do grosza, a suma zawiera kwotę i opłatę. Stawki są zapisane w kodzie, niezależnie od cennika metali. Dynamiczne przeliczanie wymaga JavaScript; w podglądzie blokującym skrypty wyświetlana jest odpowiednia informacja.

Adres: ul. Pocztowa 11, 66-400 Gorzów Wielkopolski. Telefon i WhatsApp: +48 601 775 146. „Zadzwoń” znajduje się nad WhatsAppem. W stopce są sezam.com.pl, srebrogorzow.pl i zlotogorzow.pl.

OLX: https://www.olx.pl/oferty/uzytkownik/G2XGE/ — sprawdzony w zakładce https://sezam.com.pl/oferta-olx-allegro/.

Logo: https://sezam.com.pl/wp-content/uploads/2021/04/SezamLombard_logoRGB-1.png.

## Szybkość

Brak zewnętrznych fontów, bibliotek UI, trackerów i frameworka. Wspólne CSS/JS są współdzielone między podstronami. Wersje skryptów i CSS są oznaczone skrótem zawartości. Zdjęcia mają wymiary i WebP; te niżej na stronie są ładowane leniwie. Pełne cenniki mają osobny skrypt; główna pobiera jedną odpowiedź API do dwóch skróconych cen. Artykuły i inne strony nie pobierają cen. `.htaccess` zawiera opcjonalną kompresję i cache dla Apache/LiteSpeed. Ostateczna szybkość zależy również od konfiguracji JDM i wymaga pomiaru po publikacji.

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

Test przyjmuje `PLAYWRIGHT_MODULE` jako ścieżkę do dostępnego modułu oraz `CHROMIUM_PATH` jako ścieżkę do przeglądarki. Sprawdza 19 stron przy 320/390/768/1440 px, menu, metalowe cenniki, zmianę ceny panelu, błędy sieci, kalkulator, blog i tryb bez JS.

## Paczka do hostingu / podglądu

```sh
python3 scripts/export.py
```

Wynik: `dist/lombard-gorzow.zip`. To kompletna wielostronicowa witryna, a nie pojedynczy plik HTML. Archiwum obejmuje wszystkie podstrony, używane grafiki, CSS, JS, mapę witryny, robots.txt i `.htaccess`, bez plików źródłowych panelu czy sekretów. Rozpakuj i otwórz przez lokalny serwer albo wgraj zawartość do katalogu domeny na hostingu.

Przed wdrożeniem: kopia istniejącej strony JDM, zachowanie ustawień poczty, potwierdzenie API, uzupełnienie godzin otwarcia oraz podłączenie obsługi formularza i informacji o przetwarzaniu danych. Formularz obecnie niczego nie wysyła. Strona nie została opublikowana przez zapis do repozytorium.

## Podgląd GitHub Pages

Gałąź `gh-pages` zawiera gotową kopię statycznej witryny do podglądu, z `noindex` i `.nojekyll`. Nie zmienia domeny lombard-gorzow.pl ani strony na JDM. Aby ją udostępnić, w GitHub → Settings → Pages wybierz „Deploy from a branch”, gałąź `gh-pages`, katalog `/(root)` i zapisz. Oczekiwany adres po zakończeniu wdrożenia: https://angsm111-dot.github.io/lombard-gorzow.pl/ . Samo wysłanie gałęzi nie potwierdza aktywacji Pages; konfiguracja przez GitHub API była blokowana przez sieć środowiska. Kolejne zmiany main wymagają odświeżenia kopii na gh-pages; służy do tego `python3 scripts/publish_preview.py` (wymaga dostępu Git do repozytorium). Nie ma automatycznej synchronizacji.

Baner: złoty zegarek z metalową bransoletą, Liść Klonowy zamiast monety z orłem i dwa łańcuszki. Generator wersjonuje także obrazy skrótem zawartości, aby nowy baner nie pozostawał w pamięci podręcznej przeglądarki.

Pierwszy ekran uproszczono: hasło, jedna linia o opłatach, niewielki blok promocji i dwa przyciski. Bez powielonej nazwy firmy, opisu, etykiet i paska korzyści pod banerem. Kolory zdjęcia są subtelnie stonowane przez CSS; oryginalny WebP pozostaje bez zmian.

Na dole głównej jest skrócony cennik złota 585 i srebra 925 z API oraz link do pełnego cennika. Podgląd bloga usunięto z głównej; blog i artykuły pozostają w osobnym menu i pod własnymi adresami. Ceny mają statyczny fallback z datą notowań.

Stopka zawiera także www.obraczkigorzow.pl i www.skupzlotagorzow.pl; etykiety i adresy są bez polskich znaków, zgodnie z korektą właściciela. Widok pośredni dużych kafelków cennika został usunięty: wejście z głównej pokazuje od razu złoto, selektor metali i tabelę cen.

Informacja o biżuterii została skrócona do dwóch zdań. `tests/price-tabs.cjs` sprawdza nieruchomą pozycję przełącznika dla wszystkich czterech metali, brak przeładowania dokumentu, Wstecz i odnośniki bez JS przy szerokościach 320–1440 px.

## Monety i sztabki — dwupoziomowy cennik

Pierwszy poziom wybiera metal. Pod złotem i srebrem są trzy rodzaje: Według próby, Monety, Sztabki. Platyna i pallad nie pokazują drugiego poziomu, bo ich katalogi są puste. Selektory pozostają przy górze ekranu podczas przewijania cennika. Zmiana widoku nie przeładowuje strony i zachowuje pozycję kontrolek; URL i metadane odzwierciedlają wybrany widok.

Monety i sztabki mają osobne, statyczne strony HTML i prezentują gotowe `products.goldCoins`, `goldBars`, `silverCoins`, `silverBars` → `price` z panelu. Są to **ceny za jedną sztukę**, bez ponownego mnożenia przez masę lub próbę. Pozycje z `active: false` są pomijane. Snapshot zawiera tylko niezbędne metadane, bez pól obrazów base64. Masa w opisie to masa brutto produktu.

Przy włączonym JS: wyszukiwarka po nazwie lub wadze, dokładny filtr masy dla zapytań typu `1 g`, pierwsze 12 pozycji i „Pokaż kolejne”. Bez JS statyczny HTML pokazuje cały katalog, a nawigacja działa zwykłymi linkami. Ostatnie ceny z datą są zachowane przy błędzie API. `tests/product-prices.cjs` sprawdza rodzaje cenników, kwoty z panelu, jednostkę za sztukę, niewidoczne pozycje, wyszukiwanie, ładowanie kolejnych, historię, brak przeładowania i widok bez JS przy 320/390/768/1440 px.

Sekcja „Co przyjmujemy” ma teraz pięć kategorii: Złoto i srebro (także srebrne łańcuszki na zdjęciu), Telefony/laptopy/tablety i elektronika użytkowa, osobne Konsole PlayStation, Elektronarzędzia oraz Rowery z nowoczesnym modelem MTB. Grafiki poglądowe zoptymalizowano do WebP. Zdjęcie w artykule o przygotowaniu telefonu/laptopa pozostaje osobnym plikiem.
