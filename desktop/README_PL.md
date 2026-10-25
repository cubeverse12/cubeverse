# MINEVORA Launcher — wersja integracyjna (Windows 11)

## Co zawiera

- Launcher Qt korzysta z **tych samych** plików strony `index.html`, `minevora-reference.css`, ikonek i fioletowego wilka. Obok istniejącego menu dodaje lokalną zakładkę **Graj / Instalacje**.
- Wybór oficjalnych stabilnych wydań Minecraft Java i loaderów Vanilla / Fabric / Forge / NeoForge / Quilt. Nie każda wersja wspiera wszystkie loadery.
- Kliknięcie **GRAJ** może automatycznie uruchomić instalację brakującego profilu, a następnie wznowić uruchamianie. Do gry potrzebne jest osobne logowanie Microsoft z licencją Minecraft Java.
- Pobieranie wielu wersji wymaga **wyraźnego potwierdzenia**; program nie uruchamia ogromnej instalacji samoczynnie.
- Ręczny transfer profilu WWW: zaloguj się na stronie, wyeksportuj profil w **Moje konto → Eksportuj profil do launchera (JSON)**, a następnie w aplikacji wybierz **Importuj profil WWW (JSON)**. Plik zawiera wyłącznie nick, ulubiony tryb, kolor i awatar — nigdy tokeny lub hasła.
- Strona „Moje konto” otwiera się w przeglądarce systemowej. Logowanie do strony i do Minecraft Java to odrębne sesje.

## Nowość: profil MINEVORA w Cloudflare D1 (wersja testowa)

Ta gałąź dodaje w natywnej zakładce **Graj / Instalacje** przyciski:

- **Pobierz profil z chmury** — po autoryzacji Microsoft przez oficjalną przeglądarkę pobiera nick, ulubioną minigrę, kolor i dobrowolnie dodane zdjęcie WebP z działającego API `/v1/profile`; po potwierdzeniu zastępuje lokalną kopię.
- **Wyślij lokalny profil do chmury** — tylko po wyraźnym potwierdzeniu; zachowuje kopię na Cloudflare D1.
- **Rozłącz konto profilu** — usuwa tokeny przechowywane w pamięci procesu (nie usuwa profilu w chmurze).

**Konta są rozdzielone:** dostęp do Minecraft Java wciąż wymaga własnego logowania i licencji. Token Minecraft Java nie może służyć do logowania do profilu MINEVORA. Logowanie profilu używa MSAL Python (OAuth PKCE), aplikacji Entra **MINEVORA Launcher**, zakresu `api://9136b5e6-145b-40d0-bbc4-dca668321195/profile.sync` i prywatnego Cloudflare API. Użytkownik świadomie wybiera konto przy pierwszym logowaniu, później tokeny są przechowywane tylko w pamięci RAM do zamknięcia lub rozłączenia aplikacji. Żadne tokeny nie trafiają do pliku profilu.

### Jednorazowy wymagany krok w Microsoft Entra (właściciel aplikacji)

1. Otwórz **Microsoft Entra → Rejestracje aplikacji → MINEVORA Launcher → Authentication / Uwierzytelnianie**.
2. W sekcji **Mobile and desktop applications / Aplikacje mobilne i klasyczne** **dodaj** identyfikator URI przekierowania `http://localhost` (bez portu, ścieżki i ukośnika na końcu), jeśli jeszcze go nie ma.
3. **Pozostaw** istniejący `http://localhost:8765/callback` — jest używany przez niezależne logowanie Minecraft Java. **Nie zmieniaj** adresów SPA `https://cubeverse12.github.io/cubeverse/` i `auth-popup.html`, bo obsługują działające logowanie na stronie.
4. Zapisz konfigurację. Sprawdź, czy aplikacja **MINEVORA Launcher** ma delegowane uprawnienie `MINEVORA Profile API → profile.sync`.
5. Po udostępnieniu podpisanej wersji launchera kliknij **Pobierz profil z chmury**; systemowa przeglądarka otworzy oficjalną stronę Microsoft. Wybierz to samo konto co na stronie MINEVORA i zatwierdź uprawnienie tylko wtedy, gdy chcesz przechowywać profil w chmurze.

Zgodnie z dokumentacją MSAL Python jego interaktywne logowanie używa **`http://localhost`** z dynamicznym portem i nie obsługuje niestandardowej ścieżki `/callback` w tej metodzie. Bez dodatkowego adresu autoryzacja launchera może zakończyć się błędem przekierowania.

**Status:** kod i kompilacja CI **nie zastępują rzeczywistego testu na Windows 11**. Należy sprawdzić osobno logowanie Microsoft do profilu, odczyt i zapis konta, izolację kont oraz start Minecraft. Aplikacja bez zaufanego podpisu może być zablokowana przez Windows Smart App Control — nie wyłączaj go.

## Ważne ograniczenia

**Synchronizacja jest teraz dostępna na żądanie.** Cloudflare D1 i weryfikacja tokenów działają po stronie API; launcher nie wysyła profilu automatycznie. Wymaga to zgody użytkownika i weryfikacji na Windows. Nie dodawaj sekretów ani tokenów do repozytorium.

**Inteligentna kontrola aplikacji Windows 11:** kompilacja EXE nie oznacza, że Windows pozwoli uruchomić plik. Publiczne wydanie powinno być poprawnie podpisane przez zweryfikowanego wydawcę. Workflow oferuje podpis Authenticode, jeśli administrator repozytorium skonfiguruje zaufany certyfikat w `MINEVORA_SIGNING_PFX_BASE64` i `MINEVORA_SIGNING_PFX_PASSWORD`. W przeciwnym razie ZIP jest oznaczony **UNSIGNED DEVELOPMENT BUILD** i może zostać zablokowany. **Nie wyłączaj Smart App Control, aby to obejść.**

## Testy i budowanie

Repozytorium ma workflow `.github/workflows/minevora-desktop-dev.yml` uruchamiany na gałęzi integracyjnej:
- `python -m compileall -q desktop`
- `node --check desktop/native-bridge.js`
- `python -m unittest discover -s desktop/tests -v`
- PyInstaller Windows 11: plik EXE, lokalne zasoby HTML/CSS/JS oraz grafiki w jednym katalogu.

Archiwum *development* z GitHub Actions nie jest produkcyjnym, podpisanym instalatorem. Należy oddzielnie sprawdzić logowanie Microsoft, instalacje wersji i uruchamianie gry na Windows 11.

## Instalator Windows 11 (przygotowany do testów)

CI na tej gałęzi tworzy teraz **dwa osobne artefakty**:
- `MINEVORA-WIN11-DEVELOPMENT` — archiwum folderowe PyInstaller.
- `MINEVORA-WIN11-INSTALLER-DEVELOPMENT` — instalator `MINEVORA_Setup_DEVELOPMENT.exe` budowany przez Inno Setup 6, przeznaczony **wyłącznie do testów**.

Instalator jest dla bieżącego użytkownika (bez żądania uprawnień administratora), tworzy skrót w menu Start, a opcjonalnie na pulpicie, i daje standardowe odinstalowanie. Przechowuje cały folder `_internal`. Odinstalowanie nie usuwa danych Minecraft ani zapisanych w profilu ustawień użytkownika.

**Ograniczenie bezpieczeństwa:** bez zaufanego certyfikatu instalator i launcher pozostają **niepodpisane**. Artefakt zawiera informację `UNSIGNED_SETUP.txt`; **Smart App Control może zablokować jego uruchomienie**. Nie wyłączaj zabezpieczeń i nie udostępniaj tego wydania graczom jako gotowego instalatora. Obecny workflow posiada tylko opcjonalne podpisywanie z PFX zapisanym w GitHub Actions Secrets. Certyfikaty wymagające podpisywania w usłudze/HSM muszą zostać podłączone przez właściwy interfejs dostawcy, a nie eksport klucza do repozytorium. Nawet prawidłowy podpis nie jest gwarancją akceptacji przez Smart App Control — wymagane są testy na Windows 11.

Kod instalatora: `installer/MINEVORA.iss`. Nie publikuj instalatora na stronie WWW, dopóki podpis i uruchomienie w Windows 11 nie zostaną potwierdzone.

## Jak używać profilu z witryny

1. Na https://cubeverse12.github.io/cubeverse/#account zaloguj się i zapisz profil.
2. Kliknij **Eksportuj profil do launchera (JSON)** (po wdrożeniu zmian z tej gałęzi na stronę).
3. W launcherze otwórz **Graj / Instalacje**, kliknij **Importuj profil WWW (JSON)** i wybierz pobrany plik.
4. Ponów eksport/import, jeśli później zmienisz zdjęcie lub nick. To import lokalny, nie synchronizacja w tle.

## Pozostałe kroki do wydania publicznego

1. Właściciel projektu dostarcza zaufany certyfikat podpisywania oprogramowania i konfiguruje workflow. Sprawdzić podpis i reputację przed rozpowszechnianiem.
2. Hostować chronione HTTPS API synchronizacji, weryfikujące token Microsoft i uprawnienia przed zapisem/odczytem profilu. Ustalić zasady przechowywania i usuwania danych (zwłaszcza zdjęć).
3. Osobno przetestować Minecraft Java i instalacje Vanilla/Fabric/Forge/NeoForge/Quilt na wspieranych wersjach. PvP HUD wspierany tylko tam, gdzie dostępny jest zgodny mod.
