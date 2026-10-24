# MINEVORA Launcher — wersja integracyjna (Windows 11)

## Co zawiera

- Launcher Qt korzysta z **tych samych** plików strony `index.html`, `minevora-reference.css`, ikonek i fioletowego wilka. Obok istniejącego menu dodaje lokalną zakładkę **Graj / Instalacje**.
- Wybór oficjalnych stabilnych wydań Minecraft Java i loaderów Vanilla / Fabric / Forge / NeoForge / Quilt. Nie każda wersja wspiera wszystkie loadery.
- Kliknięcie **GRAJ** może automatycznie uruchomić instalację brakującego profilu, a następnie wznowić uruchamianie. Do gry potrzebne jest osobne logowanie Microsoft z licencją Minecraft Java.
- Pobieranie wielu wersji wymaga **wyraźnego potwierdzenia**; program nie uruchamia ogromnej instalacji samoczynnie.
- Ręczny transfer profilu WWW: zaloguj się na stronie, wyeksportuj profil w **Moje konto → Eksportuj profil do launchera (JSON)**, a następnie w aplikacji wybierz **Importuj profil WWW (JSON)**. Plik zawiera wyłącznie nick, ulubiony tryb, kolor i awatar — nigdy tokeny lub hasła.
- Strona „Moje konto” otwiera się w przeglądarce systemowej. Logowanie do strony i do Minecraft Java to odrębne sesje.

## Ważne ograniczenia

**Synchronizacja profilu nie jest jeszcze automatyczna.** Wymaga hostowanego API, bazy danych i poprawnego sprawdzania tokenów Microsoft po stronie serwera. GitHub Pages nie może sam pełnić roli prywatnego backendu. Nie dodawaj sekretów ani tokenów do statycznej strony lub do repozytorium.

**Inteligentna kontrola aplikacji Windows 11:** kompilacja EXE nie oznacza, że Windows pozwoli uruchomić plik. Publiczne wydanie powinno być poprawnie podpisane przez zweryfikowanego wydawcę. Workflow oferuje podpis Authenticode, jeśli administrator repozytorium skonfiguruje zaufany certyfikat w `MINEVORA_SIGNING_PFX_BASE64` i `MINEVORA_SIGNING_PFX_PASSWORD`. W przeciwnym razie ZIP jest oznaczony **UNSIGNED DEVELOPMENT BUILD** i może zostać zablokowany. **Nie wyłączaj Smart App Control, aby to obejść.**

## Testy i budowanie

Repozytorium ma workflow `.github/workflows/minevora-desktop-dev.yml` uruchamiany na gałęzi integracyjnej:
- `python -m compileall -q desktop`
- `node --check desktop/native-bridge.js`
- `python -m unittest discover -s desktop/tests -v`
- PyInstaller Windows 11: plik EXE, lokalne zasoby HTML/CSS/JS oraz grafiki w jednym katalogu.

Archiwum *development* z GitHub Actions nie jest produkcyjnym, podpisanym instalatorem. Należy oddzielnie sprawdzić logowanie Microsoft, instalacje wersji i uruchamianie gry na Windows 11.

## Jak używać profilu z witryny

1. Na https://cubeverse12.github.io/cubeverse/#account zaloguj się i zapisz profil.
2. Kliknij **Eksportuj profil do launchera (JSON)** (po wdrożeniu zmian z tej gałęzi na stronę).
3. W launcherze otwórz **Graj / Instalacje**, kliknij **Importuj profil WWW (JSON)** i wybierz pobrany plik.
4. Ponów eksport/import, jeśli później zmienisz zdjęcie lub nick. To import lokalny, nie synchronizacja w tle.

## Pozostałe kroki do wydania publicznego

1. Właściciel projektu dostarcza zaufany certyfikat podpisywania oprogramowania i konfiguruje workflow. Sprawdzić podpis i reputację przed rozpowszechnianiem.
2. Hostować chronione HTTPS API synchronizacji, weryfikujące token Microsoft i uprawnienia przed zapisem/odczytem profilu. Ustalić zasady przechowywania i usuwania danych (zwłaszcza zdjęć).
3. Osobno przetestować Minecraft Java i instalacje Vanilla/Fabric/Forge/NeoForge/Quilt na wspieranych wersjach. PvP HUD wspierany tylko tam, gdzie dostępny jest zgodny mod.
