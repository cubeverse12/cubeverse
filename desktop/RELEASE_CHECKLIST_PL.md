# MINEVORA — bezpieczne wydanie Windows 11

**Stan na 25.10.2026:** kod i instalator deweloperski zostały przygotowane, ale publiczna wersja **nie jest jeszcze gotowa**. W szczególności instalator jest niepodpisany i może być blokowany przez Windows 11 Smart App Control.

## Co już przygotowano automatycznie

- Pakowanie launchera oraz jego zasobów przez PyInstaller.
- Instalator Inno Setup 6, bez automatycznej prośby o uprawnienia administratora. Skróty do menu Start i opcjonalnie na pulpicie.
- Podpisywanie Authenticode EXE oraz instalatora, jeśli skonfigurowano **zaufane** i używalne poświadczenia wydawcy.
- Testy walidacji profilu, składni Python/JavaScript i kompilacji Windows w GitHub Actions.
- Test instalacji/odinstalowania **na maszynie GitHub Actions** (nie zastępuje testów na Windows użytkownika).
- Raport sum SHA256 i status podpisu dla obu plików.
- Publiczna strona zachowuje zakładkę **Pobieranie**, ale do momentu testów pokazuje status projektu zamiast linku do niepodpisanego ZIP-a.

## Czego nie może zrobić automatyczny skrypt

**Zaufanego certyfikatu do podpisywania kodu nie wolno tworzyć przez samopodpisanie i przedstawiać jako zaufany podpis wydawcy.** Wymaga zweryfikowania tożsamości uprawnionego właściciela wydania u dostawcy certyfikatu lub w odpowiedniej usłudze. Nigdy nie przesyłaj dowodu osobistego, danych płatności, prywatnych kluczy, hasła do certyfikatu ani tokenów Microsoft na czat ani do publicznego repozytorium.

Według dokumentacji Microsoft Artifact Signing z października 2026 opcja **Public Trust dla osób prywatnych** jest dostępna tylko w USA i Kanadzie, **a w Polsce organizacje** mogą kwalifikować się po weryfikacji. W Polsce wydawca indywidualny powinien sprawdzić certyfikat code signing u akredytowanego dostawcy, z jego rzeczywistymi wymaganiami weryfikacji. Jeżeli wydawca nie jest pełnoletni lub nie może samodzielnie zawrzeć wymaganej umowy, formalności prowadzi właściwy rodzic/opiekun albo upoważniony dorosły przedstawiciel organizacji; nie należy omijać weryfikacji wieku ani tożsamości.

Źródła Microsoft:
- https://learn.microsoft.com/pl-pl/azure/artifact-signing/quickstart
- https://learn.microsoft.com/en-us/windows/apps/develop/smart-app-control/overview
- https://support.microsoft.com/en-us/windows/security/threat-malware-protection/smart-app-control-frequently-asked-questions

## Kontrola przed publikacją

1. Zweryfikować tożsamość wydawcy i uzyskać **zaufany** podpis kodu Windows dla aplikacji i instalatora (oraz innych wymaganych plików wykonywalnych/bibliotek).
2. Jeśli certyfikat daje się użyć jako PFX, poświadczenia udostępnić **tylko** w prywatnych GitHub Actions Secrets: `MINEVORA_SIGNING_PFX_BASE64` oraz `MINEVORA_SIGNING_PFX_PASSWORD`. Dla usługi podpisującej/HSM trzeba użyć osobnej oficjalnej integracji dostawcy, **nie wyciągać klucza prywatnego**.
3. Uruchomić pipeline `minevora-desktop-dev.yml`. Sprawdzić wynik testów, instalacji i odinstalowania oraz raport `BUILD_CHECKSUMS_SHA256.txt`.
4. Zweryfikować poprawny podpis i łańcuch zaufania programu, instalatora i wymaganych plików przez Microsoft SignTool; sprawdzić tożsamość wydawcy, datowanie podpisu i zgodność sum SHA256.
5. Na rzeczywistym Windows 11, **z włączonym Smart App Control**, przetestować instalator, uruchomienie UI, logowanie Microsoft do profilu, pobranie/zapis Cloudflare, uruchomienie licencjonowanego Minecraft Java i odinstalowanie.
6. Przejrzeć bezpieczeństwo bundlowanych zależności i licencje; sprawdzić zachowanie antywirusa i SmartScreen. Nowy certyfikat/podpis nie gwarantuje braku wszystkich ostrzeżeń.
7. Dopiero po spełnieniu punktów 1–6 opublikować **oddzielne wydanie produkcyjne** w GitHub Releases i zmienić link na stronie na to konkretne podpisane wydanie; nie podmieniać w ciemno deweloperskiego ZIP-a.

**Zakaz:** nie radzić graczom wyłączać Smart App Control, korzystać z niezweryfikowanych wyjątków, certyfikatów z internetu ani samopodpisanych certyfikatów jako sposobu obejścia blokady. Dla osobistego testowania interfejsu nadal działa publiczna strona WWW MINEVORA.

## Gotowy wynik

CI może tworzyć instalator testowy jeszcze bez certyfikatu, ale **nie należy go publikować jako dostępnego dla wszystkich użytkowników**, dopóki podpis i test na Windows 11 nie zostaną ukończone.
