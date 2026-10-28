# Praca i publikacja

- Użytkownik zleca poprawki w Codexie. Po ich wykonaniu sprawdź stronę, zrób commit i wyślij zmiany do GitHuba.
- Docelowy proces: po poprawnym sprawdzeniu zmian publikuj również na JDM, pod domeną lombard-gorzow.pl. Użytkownik upoważnił do tego procesu; nie pytaj ponownie o zgodę na każdą aktualizację.
- Automatyczna publikacja JDM jest włączona w `.github/workflows/deploy-jdm.yml` po każdym push main (można zatrzymać zmienną JDM_DEPLOY_ENABLED=false). SSH web16.jdm.pl:2233, użytkownik lombardg, katalog /home/lombardg/public_html; rsync potwierdzony. Hasło: sekret JDM_PASSWORD. Publiczny klucz serwera przekazany przez użytkownika przypięty w config/jdm_known_hosts. HTTPS sprawdzany przed wysyłką; wynik wdrożenia wymaga potwierdzenia w Actions. Nie przedstawiaj samego push jako potwierdzonej publikacji na JDM.
- Użytkownik potwierdził, że ma już kopię na serwerze i nie chce kolejnej. Nie twórz dodatkowej kopii. Przed pierwszą podmianą ustal katalog domeny i lokalizację istniejącej kopii do ewentualnego przywrócenia. Zachowaj ustawienia poczty i DNS.
- Dostęp do hostingu przechowuj wyłącznie w sekretach. Nie zapisuj haseł ani prywatnych kluczy w repozytorium lub logach. Publiczny klucz tożsamości hosta SSH jest jawny i może być wersjonowany. Protokół i sposób automatyzacji dobierz po potwierdzeniu możliwości hostingu.
- Źródła i polecenia budowania opisano w README.md. Nie edytuj wygenerowanych HTML jako źródeł.
