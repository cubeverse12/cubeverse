# MINEVORA 4.1 GLOW — postęp prac

Aktualizacja: 31.10.2026. Ten dokument rozdziela **podgląd WWW** od **aplikacji Windows**. Nie należy przedstawiać zachowania makiety jako funkcji działającego launchera.

## Etap 1 — podgląd WWW i profile
- [x] Boczne menu, jeden mały plus pod „Serwery Minecraft”, okno tworzenia profilu poza ukrywanymi zakładkami.
- [x] Nazwa profilu, wersja Minecraft, wybór loadera, logo użytkownika i lokalny zapis profilu.
- [x] Automatyczne zmniejszanie dużego obrazka profilu do 256 × 256 px.
- [x] Katalog Modrinth: mody, modpacki, shadery, resource packi i datapacki, obrazy, opisy, autorzy i stronicowanie.
- [x] Po kliknięciu „Do profilu”: pobranie metadanych konkretnego wydania przez API Modrinth i weryfikacja Minecraft/loadera (gdy dotyczy).
- [x] Zachowanie numeru wersji dodatku i informacji o wymaganych zależnościach w lokalnym planie profilu.
- [x] Kontrola składni i regresji dodana do GitHub Actions.
- [ ] Test realnego zapytania Modrinth i renderowania całej listy w przeglądarce użytkownika — do potwierdzenia. Dostępność usługi, CORS i obrazy zależą od środowiska.

## Etap 2 — instalacje w aplikacji desktopowej (nieukończone)
- [ ] Podłączenie obecnego katalogu i profili do rzeczywistego kodu Tauri/Rust launchera 4.1.
- [ ] Pobieranie wybranych wersji plików Minecraft/modów tylko ze zweryfikowanych źródeł, kontrola sum SHA-512/SHA-1.
- [ ] Instalacja i uruchamianie zgodnych loaderów — najpierw Fabric; następnie Forge, NeoForge i Quilt.
- [ ] Rozwiązywanie zależności modów, komunikaty o konfliktach wersji, naprawa instalacji i aktualizacje.
- [ ] Import/eksport rzeczywistych modpacków .mrpack (a nie tylko planu JSON).
- [ ] Pełne testy na Windows 11 i uruchomienie Minecrafta; obecny podgląd nie może ich zastąpić.

## Etap 3 — pozostałe moduły (nieukończone)
- [ ] Podłączenie Skin Studio do prawdziwego konta / obsługi skinów w grze.
- [ ] Osobny zgodny z wersją gry mod PvP HUD; test serc nad graczami i przesuwania paneli.
- [ ] Publiczny katalog serwerów z backendem i moderacją wpisów.
- [ ] Poprawne logowanie Microsoft w aplikacji.
- [ ] Spójny wygląd strony i aplikacji, tłumaczenia PL/EN, testy aktualizatora i instalatora Windows.

## Uwagi o testach
Kody JavaScript przeszły kontrolę składni. Logika wyboru konkretnej wersji została sprawdzona przy użyciu danych testowych (Fabric 1.21.1, zależność wymagana, odrzucenie Vanilla). GitHub Actions zostało skonfigurowane, ale nie zostało jeszcze potwierdzone zakończenie jego uruchomienia. Nie deklaruje się testu instalatora Windows ani realnego pobierania plików Minecrafta.
