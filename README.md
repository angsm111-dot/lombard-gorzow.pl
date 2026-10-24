# Lombard Sezam — lombard-gorzow.pl

Projekt nowej strony Lombardu Sezam w Gorzowie Wielkopolskim. Statyczny HTML, CSS i JavaScript, bez instalowania pakietów. Paleta: granat, bordo i ciepłe beże.

## Kontynuacja pracy w chmurze

Otwórz repozytorium `angsm111-dot/lombard-gorzow.pl`, gałąź `main`. Użyj istniejącego checkoutu w izolowanym środowisku; nie twórz dodatkowego Git worktree, chyba że użytkownik o to poprosi.

W katalogu repozytorium uruchom:

```sh
python3 -m http.server 5173 --bind 0.0.0.0
```

Serwer jest procesem lokalnym i trzeba go uruchomić ponownie w nowej sesji. Pliki źródłowe: `index.html`, `style.css`, `app.js`, `assets/`. Serwer produkcyjny nie wymaga Pythona: wystarczy hosting plików statycznych.

Samodzielny plik HTML do pobrania, z osadzonymi grafikami, stylem i skryptem:

```sh
python3 scripts/export.py
```

Wynik: `dist/lombard-gorzow.html`. Opcjonalnie podaj docelową ścieżkę jako argument. Wynik jest generowany z repozytorium; katalog `dist/` nie jest śledzony.

## Zawartość i ustalenia

- Logo pobrane z sezam.com.pl; bez dodatkowego napisu powielającego logo.
- Hasło „Tylko 5% / miesiąc dla nowych klientów”, z dopiskiem „Stawka 5% za 30 dni”.
- „Najniższe opłaty w Gorzowie i woj. lubuskim” — treść przekazana przez właściciela.
- Menu: Co przyjmujemy, Na sprzedaż, Cennik skupu złota, Sprawdź, ile zapłacisz, Blog, Kontakt.
- Brak ofert produktów i ich cen na głównej. Sekcja sprzedaży odsyła do OLX.
- WhatsApp: +48 601 775 146; przycisk otwiera rozmowę, nie wysyła wiadomości automatycznie.
- Blog: cztery pełne artykuły rozwijane na stronie, o przyjmowanych przedmiotach, złocie, przygotowaniu elektroniki i świętach Bożego Narodzenia 2027.
- Stopka: sezam.com.pl, srebrogorzow.pl, zlotogorzow.pl.
- Docelowa domena: lombard-gorzow.pl, obecnie wskazuje inną stronę na hostingu JDM. Nie zmieniano DNS ani hostingu.

## Kalkulator opłat

Źródło stawek: https://sezam.com.pl/kalkulator-oplat/ (odczyt 24.10.2026). Zakres 50–100 000 zł; 2,5% za 15 dni i 5% za 30 dni. Wynik pokazuje opłatę za wybrany okres oraz kwotę razem z opłatą, z zaokrągleniem do grosza. Stawki są zapisane w kodzie, niezależnie od API cen złota. Dostępne pole kwoty, suwak, przyciski przykładowych kwot i walidacja.

## Cennik z panelu SEZAM

- Repozytorium panelu: https://github.com/angsm111-dot/nowa-skup-zlota-gorzow
- Panel: https://skup-zlota-gorzow.angsm111.workers.dev/admin
- Publiczny odczyt: https://skup-zlota-gorzow.angsm111.workers.dev/api/prices
- Sprawdzona implementacja panelu: commit `9c16cebbee0b1dc4df683e974ff47c2d192d5c1b`.

Widok odczytuje gotowe `metals.gold.purities[próba].price` w PLN/g. Nie nalicza ponownie potrąceń i nie używa hasła administratora. Lista prób pochodzi z API. Aktualizacja przy otwarciu, co minutę w widocznej karcie, po powrocie do karty i przyciskiem. Przy błędzie zachowuje ostatnio pobrane ceny z datą notowań i wyraźnym ostrzeżeniem, że aktualność nie została potwierdzona. Data notowań z `fetchedAt` jest prezentowana w strefie Europe/Warsaw.

Wdrożone API musi udostępniać publiczny CORS `Access-Control-Allow-Origin: *`, obecny w kodzie panelu. Produkcyjny odczyt przez curl z weryfikacją TLS został potwierdzony 24.10.2026; API zwraca dziewięć prób złota i publiczny CORS. Bezpośredni odczyt w testowym Chromium blokuje certyfikat proxy środowiska (`ERR_CERT_AUTHORITY_INVALID`), nie brak danych panelu. Dodanie domeny API zapisano w projekcie konfiguracji środowiska; jej aktywacja wymaga zapisania i publikacji w ustawieniach środowiska. Potwierdzono odpowiedź wdrożonego API; bezpośredni odczyt w zwykłej przeglądarce poza środowiskiem pozostaje do sprawdzenia. Nie zmieniano kodu ani danych panelu.

## Sprawdzone zachowanie

Testy w Chromium/Playwright: kalkulator (15/30 dni, zakres, grosze, niepoprawne dane, suwak, przyciski), blog (cztery teksty, otwieranie i zamykanie), obrazy, menu, WhatsApp, odnośniki oraz układ komputerowy bez błędów JS. Cennik sprawdzono z odpowiedzią generowaną przez kod Workera: ręczne i automatyczne stawki, zmiana ceny, błąd HTTP, błędne dane i odzyskanie połączenia. To nie zastępuje sprawdzenia produkcyjnego API.

## Do zrobienia przed publikacją

1. Potwierdzić bezpośredni odczyt cen w przeglądarce po wdrożeniu na JDM.
2. Uzupełnić godziny otwarcia. Adres z sezam.com.pl: ul. Pocztowa 11, 66-400 Gorzów Wielkopolski.
3. Podłączyć obsługę formularza wyceny i informacje o przetwarzaniu danych. Obecnie formularz jest demonstracyjny i nie wysyła danych.
4. W razie potrzeby potwierdzić profil OLX: https://www.olx.pl/oferty/uzytkownik/G2XGE/ pochodzi z https://sezam.com.pl/oferta-olx-allegro/. Właściciel odłożył podanie linku na później.
5. Przed publikacją obejrzeć wersję mobilną na rzeczywistych urządzeniach. Menu mobilne i responsywność zweryfikowano w Chromium dla 320, 360, 390, 430, 600, 768, 900, 1024 i 1440 px.
6. Ustalić sposób wdrożenia na JDM, wykonać kopię obecnej strony i zachować konfigurację poczty przed podmianą. Strona nie została opublikowana.

## Grafiki

`assets/sezam-logo.png`: https://sezam.com.pl/wp-content/uploads/2021/04/SezamLombard_logoRGB-1.png.

`assets/zlota-bizuteria.png`: fotorealistyczna grafika wygenerowana AI; nie jest fotografią rzeczywistych produktów firmy.

## Ostatnio pobrany cennik i kontakt telefoniczny

`python3 scripts/update_prices.py` pobiera publiczne ceny przez curl z weryfikacją TLS i zapisuje zweryfikowany snapshot `prices-snapshot.json` oraz wiersze tabeli w HTML. Następnie `python3 scripts/export.py` generuje samodzielny plik. Dzięki temu cennik jest widoczny także przy zablokowanym JS lub błędzie sieci. Statyczne ceny mają datę i nie są przedstawiane jako potwierdzone aktualne; działający JS nadal odświeża je z panelu. W razie zmiany cen dla wersji bez JS odśwież snapshot przed wdrożeniem.

Kontakt zawiera osobne przyciski WhatsApp i „Zadzwoń” (`tel:+48601775146`). Usunięto ze strony notatkę o kalkulacji według sezam.com.pl na prośbę właściciela.

## Zdjęcia poglądowe

Artykuły blogowe i sekcja przyjmowanych przedmiotów mają zdjęcia nagłówkowe. Dodatkowy kadr prezentuje wycenę biżuterii. Grafiki w `assets/blog-*.webp` oraz `assets/wycena-bizuterii.webp` są wygenerowanymi fotorealistycznymi ilustracjami, nie dokumentują lokalu, pracowników ani produktów firmy. Obrazy mają teksty alternatywne i leniwe ładowanie.

## Nawigacja mobilna

Do 900 px: przycisk z ikoną i napisem „Menu”, atrybuty aria-expanded i aria-controls, zamykanie po wyborze odnośnika, kliknięciu poza nagłówkiem i Escape (z przywróceniem fokusu). Bez JavaScript odnośniki pozostają widoczne. Powyżej 900 px standardowe menu. Układ zdjęć, kalkulatora, bloga i kontaktu dostosowany do mniejszych ekranów.
