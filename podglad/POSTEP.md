# MINEVORA 4.1 GLOW — postęp prac

Aktualizacja: 01.11.2026. Ten dokument rozdziela **podgląd WWW** od **aplikacji Windows**. Nie należy przedstawiać zachowania makiety jako funkcji działającego launchera.

## Następny krok (priorytet) — przycisk PLAY w launcherze Windows

- [ ] W zakładce **Start** aplikacji MINEVORA Windows umieścić **duży, wyraźny, fioletowy przycisk PLAY** z subtelną animacją; wygląd zgodny z podglądem WWW.
- [ ] Pod przyciskiem pokazać wybór **profilu/instancji** oraz **wersji Minecrafta i loadera**; wybrany profil ma determinować uruchamianą grę.
- [ ] Podłączyć PLAY do działającego mechanizmu startu aplikacji desktopowej: sprawdzenie poprawnego konta/sesji Microsoft i uprawnień do Minecraft Java, weryfikacja plików, pobranie brakujących plików gry, loadera i zgodnych zależności, a następnie uruchomienie Minecrafta.
- [ ] Pokazać rzeczywisty stan operacji (**Przygotowanie / Pobieranie / Uruchamianie / Błąd**), postęp, czytelne błędy i możliwość bezpiecznej ponownej próby; zabezpieczyć przed wielokrotnym uruchomieniem po podwójnym kliknięciu.
- [ ] Przetestować PLAY i cały przepływ od wyboru profilu do uruchomienia gry na **Windows 11**, w tym brak internetu, niezgodne mody i brak autoryzacji.
- [ ] Zachować spójność wyglądu **strony WWW i launchera**, ale nie sugerować, że przycisk w podglądzie strony uruchamia grę — **strona pozostaje demonstracją**, a działanie PLAY wymaga programu Windows.

**Postęp na 01.11.2026:** przygotowano **eksperymentalną paczkę 18.3.9 PLAY** w repozytorium `minevora-launcher`. Duży przycisk PLAY jest nadal połączony z istniejącą metodą `launcher.play`, a karty wyboru prowadzą do istniejących paneli profili i loaderów. GitHub Actions pomyślnie zakończył testy kodu i budowę ZIP: https://github.com/cubeverse12/minevora-launcher/actions/runs/41285674814 (Artifact: `MINEVORA-18.3.9-PLAY-EXPERIMENTAL`). **Nie potwierdzono jeszcze** logowania Microsoft ani uruchomienia Minecrafta i instalacji plików na Windows 11. Nie jest to stabilne wydanie.

## Etap 1 — podgląd WWW i profile
- [x] Boczne menu, jeden mały plus pod „Ustawienia” (po oddzielającym pasku), okno tworzenia profilu poza ukrywanymi zakładkami.
- [x] Nazwa profilu, wersja Minecraft, wybór loadera, logo użytkownika i lokalny zapis profilu.
- [x] Automatyczne zmniejszanie dużego obrazka profilu do 256 × 256 px.
- [x] Katalog Modrinth: mody, shadery, resource packi i datapacki, obrazy, opisy, autorzy i stronicowanie. Gotowe modpacki są poza listą dodatków profilu.
- [x] Po kliknięciu „Do profilu”: pobranie metadanych konkretnego wydania przez API Modrinth i weryfikacja Minecraft/loadera (gdy dotyczy).
- [x] Zachowanie numeru wersji dodatku i informacji o wymaganych zależnościach w lokalnym planie profilu.
- [x] Kontrola składni i regresji dodana do GitHub Actions.
- [ ] Test realnego zapytania Modrinth i renderowania całej listy w przeglądarce użytkownika — do potwierdzenia. Dostępność usługi, CORS i obrazy zależą od środowiska.

## Etap 2 — instalacje w aplikacji desktopowej (nieukończone)
- [ ] Podłączenie obecnego katalogu i profili do rzeczywistego launchera Windows (istniejący kod PySide6/Qt, nie Tauri/Rust).
- [x] Osobny, niepodłączony do GUI moduł planu instalacji Modrinth w repozytorium `minevora-launcher`: weryfikacja metadanych, loaderów, SHA-512; uruchamianie jako dry-run, opcjonalnie pobieranie dodatków (nie Minecrafta ani brakujących zależności).
- [ ] Podłączenie pobierania do GUI i pełna instalacja Minecrafta, loadera, zależności oraz wybranych modów.
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
Nowy moduł w repozytorium launchera: https://github.com/cubeverse12/minevora-launcher/blob/main/tools/modrinth_plan_installer.py. Testy offline zakończone sukcesem (GitHub Actions: https://github.com/cubeverse12/minevora-launcher/actions/runs/41242441149). Nie jest to potwierdzenie pracy launchera GUI ani instalacji Minecrafta.

Kody JavaScript przeszły kontrolę składni. Logika wyboru konkretnej wersji została sprawdzona przy użyciu danych testowych (Fabric 1.21.1, zależność wymagana, odrzucenie Vanilla). GitHub Actions zostało skonfigurowane, ale nie zostało jeszcze potwierdzone zakończenie jego uruchomienia. Nie deklaruje się testu instalatora Windows ani realnego pobierania plików Minecrafta.


### Integracja launchera Windows — 31.10.2026

- [x] Dodałem w repozytorium `minevora-launcher` moduł MSAL device-code + Xbox/XSTS/Minecraft do weryfikacji konta Java, bez adresu callback localhost i bez zapisu tokenów na dysku.
- [x] Dodałem okno PySide6 z logowaniem Microsoft i weryfikacją planu Modrinth; na życzenie instaluje sprawdzone dodatki do wskazanej instancji.
- [x] Zbudowałem **eksperymentalną** paczkę 18.3.8 na bazie publicznej 18.3.7, z menu Ctrl+M. Testy modułów offline: 24/24; kompilacja nowej paczki i kontrole AST zakończone sukcesem.
- [ ] Logowanie wymaga własnego identyfikatora rejestracji aplikacji Microsoft (`MINEVORA_MS_CLIENT_ID`) i dostępu do wymaganych usług Minecraft. Nie przeprowadzono testu konta na żywo.
- [ ] Potwierdzenie uruchomienia paczki na Windows 11, integracja przycisku GRAJ z nową sesją Microsoft i pełny instalator Minecraft + loaderów pozostają niewykonane.

**Eksperymentalny artefakt GitHub Actions:** https://github.com/cubeverse12/minevora-launcher/actions/runs/41243357172 (sekcja Artifacts, MINEVORA-18.3.8-SERVICES-EXPERIMENTAL). Nie jest to stabilny release.


### Weryfikacja instalatora po poprawkach — 31.10.2026

- [x] Zaostrzono weryfikację zależności Modrinth: `project_id` i `version_id` muszą odpowiadać zapisanym dodatkom. Dodano testy regresyjne.
- [x] Już istniejące pliki `.jar` i `.zip` są sprawdzane strumieniowo, bez wczytywania całego pliku do RAM.
- [x] Eksperymentalna paczka 18.3.8 ponownie zbudowana pomyślnie: https://github.com/cubeverse12/minevora-launcher/actions/runs/41243717425.
- [x] Dodatkowe testy regresyjne zakończone sukcesem: https://github.com/cubeverse12/minevora-launcher/actions/runs/41243650801.

**Ograniczenia:** nadal bez testu logowania prawdziwym kontem Microsoft i startu Minecrafta na Windows. 18.3.8 pozostaje wersją eksperymentalną.
