# MINEVORA — wygląd 1:1 ze stroną GitHub Pages

Ta wersja nie tworzy drugiego interfejsu w Qt. Uruchamia w oknie aplikacji **dokładnie ten sam lokalny** `../index.html`, `../minevora-reference.css`, `../avatar-preview.js`, `../minevora-reference.js` oraz `../assets/`, co strona https://cubeverse12.github.io/cubeverse/.

Dzięki temu menu, logo, fioletowo-granatowe kolory, grafiki i model 3D pochodzą z tych samych plików. Plik `native-bridge.js` jest wstrzykiwany **tylko wewnątrz Windows** i zamienia demonstracyjne kliknięcia w ograniczone wywołania Pythona.

## Uruchomienie — Windows 11

1. Pobierz **całe repozytorium** ZIP z tej gałęzi (sam folder `desktop` nie wystarczy).
2. Rozpakuj do własnego folderu, nie uruchamiaj skryptów z archiwum.
3. Uruchom `desktop/START_WINDOWS.bat`. Skrypt instaluje zależności we własnym .venv.
4. W aplikacji: wybierz wersję i loader, przejdź do **Instalacje** i kliknij instalację. Możesz też wprost kliknąć **GRAJ** — brakujące wydanie zostanie pobrane.
5. Do uruchomienia Minecraft Java potrzebne jest legalne konto Microsoft z grą. Kliknij **Zaloguj Microsoft**. Logowanie wymaga *Twojego własnego* Client ID z Entra i zgodnego `http://localhost:8765/callback` w konfiguracji aplikacji. Nie wpisuj hasła do launchera.
6. Kliknij `+` przy skinie, aby wczytać lokalny PNG 64×64 lub 64×32. Animacje na stronie zachowują dotychczasowe tryby.
7. Opcja **Pobierz wszystkie stabilne wersje** wymaga dodatkowego potwierdzenia i dużego zapasu miejsca. Przerwanie następuje dopiero po bieżącej operacji.

## Zakres i ograniczenia

- **Ten sam wygląd**: wynika z użycia dosłownie tego samego HTML, CSS, JS i obrazów. Wszystko jest ładowane z dysku, więc GitHub Pages nie musi działać w czasie uruchamiania.
- **Backend**: zawiera oryginalne moduły MINEVORA 20 (`backend.py`, `core.py`, `minevora_engine.py`, `auth_diagnostics.py`). Zachowuje profile, instalację Java, zgodne loadery i uruchamianie gry.
- **Skins**: import lokalnych PNG i render 3D; nie pobiera automatycznie aktualnego skina z konta Microsoft. Historyczny format 64×32 jest dopełniany pustą warstwą; stara geometria ramion może wymagać dalszego odwzorowania.
- **Marketplace** pozostaje demonstracyjny. Nie ma aktywnych zakupów ani płatności.
- **PvP HUD** działa wyłącznie w dotychczas wspieranej kombinacji Fabric 1.21.1, o ile pobranie zweryfikowanego wydania się powiedzie.
- **Wersje** są pobierane z katalogu stabilnych Minecraft Java; nie każda stara wersja ma zgodne loadery.
- **Testy**: składnię modułu wejściowego sprawdzono statycznie. Nie zweryfikowano jeszcze uruchomienia graficznego, logowania Microsoft, wszystkich wersji ani builda EXE na Windows 11. To gałąź testowa do przeglądu.

## Dlaczego nie otwiera od razu publicznej strony?

Aplikacja wyświetla lokalny, znany kod strony. Połączenie do systemu plików i gry otrzymuje tylko ta lokalna kopia; nie udostępniamy uprzywilejowanego mostu dowolnej zdalnej witrynie. Żadnych haseł ani tokenów nie zapisuje się w projektowych plikach.
