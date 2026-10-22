# MINEVORA PvP HUD — Fabric 1.21.1 (źródła)

**Ważne:** ta paczka zawiera projekt źródłowy, nie skompilowany mod `.jar`. Sam launcher nie jest modem Minecraft. Żeby HUD był widoczny na serwerach, potrzebny jest `.jar` zbudowany z tego projektu, uruchomiony w kliencie Minecraft 1.21.1 Fabric razem z Fabric API. Mod jest kliencki; nie wymaga instalacji na serwerze, ale używaj tylko tam, gdzie regulamin to dopuszcza.

## Budowanie bez instalowania Gradle na Windows (GitHub Actions)

1. Utwórz **osobne repozytorium** dla kodu moda, np. `minevora-pvp-hud`.
2. Wgraj **zawartość tego folderu**, tak aby `build.gradle`, `settings.gradle`, `src/` i `.github/workflows/build-mod.yml` były w katalogu głównym repozytorium.
3. W GitHub kliknij **Actions → Build MINEVORA PvP HUD → Run workflow** (lub wykonaj commit).
4. Po udanym uruchomieniu pobierz artifact `minevora-pvp-hud-fabric-1.21.1`.
5. Rozpakuj artifact ZIP. Otrzymasz plik `.jar` i ewentualny `-sources.jar`; wybierz **plik bez `-sources`**.
6. Otwórz MINEVORA 17.7 → **PvP Mod Menu** → **Zainstaluj mod .jar**.
7. Zainstaluj Minecraft 1.21.1 **Fabric Loader** i **Fabric API**, ustaw tę instancję w launcherze, włącz funkcje PvP i kliknij **Zapisz do Minecraft**.
8. Uruchom Fabric 1.21.1 i wejdź na serwer dopuszczający mody HUD.

## Alternatywnie: Gradle lokalnie

W katalogu projektu uruchom `gradle build` z Java 21 i Gradle 8.12 oraz dostępem do internetu. Gotowy mod powinien znaleźć się w `build/libs/`. Nie instaluj pliku `-sources.jar`.

## HUD

- CPS: liczba kliknięć na sekundę oszacowana na podstawie stanu przycisków w kolejnych klatkach, więc bardzo szybkie kliknięcia mogą nie zostać wykryte.
- Keystrokes: aktywne WASD gracza.
- Armor: procent pozostałej trwałości elementów zbroi.
- Potion: efekty i czas pozostający.
- FPS: licznik FPS gry.
- Crosshair: konfigurowany kolor dodatkowych linii celownika (nakładka; nie usuwa domyślnego celownika).
- Combo: liczba lokalnych prób ataku na jednostki w niedługim czasie; **nie jest potwierdzeniem obrażeń**.

Zmiany ustawień w launcherze zapisywane są w `<katalog instancji>/config/minevora_pvp.json`; mod odczytuje je co około sekundę, również w czasie gry. **Nie używa autoataku, radarów ani mechanizmów obchodzenia anti-cheat**.

## Zastrzeżenie

W tym środowisku nie można pobrać zależności Gradle/Fabric, więc **kompilacja moda ani test w uruchomionym Minecraft nie zostały wykonane**. Po kompilacji na GitHub należy sprawdzić wynik i zgłosić błędy z Actions; w razie zmian API może być potrzebna korekta kodu. Testy Pythona obejmują obsługę plików i integrację launchera.
