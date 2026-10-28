# Praca i publikacja

- Użytkownik zleca poprawki w Codexie. Po ich wykonaniu sprawdź stronę, zrób commit i wyślij zmiany do GitHuba.
- Docelowy proces: po poprawnym sprawdzeniu zmian publikuj również na JDM, pod domeną lombard-gorzow.pl. Użytkownik upoważnił do tego procesu; nie pytaj ponownie o zgodę na każdą aktualizację.
- Przygotowano `.github/workflows/deploy-jdm.yml` dla SSH web16.jdm.pl:2233, użytkownik lombardg. Aktywacja wymaga sekretów JDM_PASSWORD i JDM_KNOWN_HOSTS oraz zmiennej JDM_DEPLOY_ENABLED=true. Potwierdzony przez odczyt SSH katalog: /home/lombardg/public_html; rsync dostępny; szczegóły w WDROZENIE-JDM.md. Obecnie połączenie z JDM nie jest jeszcze skonfigurowane. Nie przedstawiaj samego push do GitHuba jako wdrożenia na JDM.
- Użytkownik potwierdził, że ma już kopię na serwerze i nie chce kolejnej. Nie twórz dodatkowej kopii. Przed pierwszą podmianą ustal katalog domeny i lokalizację istniejącej kopii do ewentualnego przywrócenia. Zachowaj ustawienia poczty i DNS.
- Dostęp do hostingu przechowuj wyłącznie w sekretach. Nie zapisuj haseł ani kluczy w repozytorium lub logach. Protokół i sposób automatyzacji dobierz po potwierdzeniu możliwości hostingu.
- Źródła i polecenia budowania opisano w README.md. Nie edytuj wygenerowanych HTML jako źródeł.
