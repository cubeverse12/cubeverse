# MINEVORA Launcher — Microsoft Store (MSIX, projekt wydania)

## Stan projektu

Partner Center: **MINEVORA Launcher** ma zarezerwowaną nazwę. Publiczna wersja **nie została jeszcze przesłana do certyfikacji ani opublikowana**. Projekt MSIX jest w gałęzi deweloperskiej i służy do przygotowania przesyłki.

Dane publiczne z **Product Identity** (przeniesione 1:1 do `msix/AppxManifest.xml`):

| Klucz | Wartość |
|---|---|
| Identity / Name | `MINEVORA.MINEVORALauncher` |
| Identity / Publisher | `CN=7E2F1067-3B52-463F-A3BC-3AEFC8F3160B` |
| PublisherDisplayName | `MINEVORA` |
| Store ID | `9MWBQH7NWQL1` |
| Architecture | `x64` |
| Version (pierwszy projekt) | `0.2.0.0` |

Nazwa aplikacji `MINEVORA Launcher` może pozostać nazwą w sklepie. Nie zmieniaj ciągów Name i Publisher w manifeście bez uprzedniej zmiany tożsamości produktu w Partner Center.

## Jak utworzyć paczkę (po testach i z uprawnionym wydawcą)

1. Otwórz w GitHub `cubeverse12/cubeverse` → **Actions** → **MINEVORA integrated Windows launcher (development)**.
2. Otwórz najnowszy **zielony** przebieg gałęzi `codex/minevora-desktop-profile-cloud-sync-20261025`.
3. W sekcji **Artifacts** pobierz `MINEVORA-MSIX-STORE-DRAFT` i rozpakuj ZIP na dysku. Sprawdź raport `READ_ME_STORE_DRAFT.txt`.
4. Plik `MINEVORA_Launcher_0.2.0.0_x64_STORE_DRAFT.msix` jest **niepodpisanym pakietem przeznaczonym do przesłania do Microsoft Store**, nie do ręcznego uruchamiania na Windows. Nie uruchamiaj go przez dwuklik.
5. Wejdź do **Microsoft Partner Center → Apps and games → MINEVORA Launcher → Application overview → Start submission**.
6. Zapisz wymagane pola: Pricing and availability, Properties, Age ratings, Store listings, ewentualna polityka prywatności i notatki dla testerów. Uczciwie opisz, że jest to nieoficjalny launcher do Minecraft Java, a do korzystania z gry potrzebna jest licencja.
7. W sekcji **Packages** prześlij MSIX. Jeśli walidacja zgłosi błędy, **nie** klikaj **Submit for certification** — popraw manifest/plik i zbuduj ponownie.
8. Przed ostatecznym wysłaniem aplikacji na certyfikację konieczny jest test działania procesu PySide6/QtWebEngine oraz pobierania Minecraft Java jako spakowanej aplikacji. Uruchomienie kompilacji CI i walidacja pliku MSIX nie potwierdzają jeszcze działania aplikacji w sklepie.
9. Po przejściu certyfikacji Microsoft Store podpisuje poprawnie zgłoszone pakiety MSIX zaufanym certyfikatem. Wtedy użytkownik instaluje MINEVORA ze Sklepu, a nie poprzez niepodpisany EXE lub ZIP.

## Ważne wymagania bezpieczeństwa i zgodności

- **Wydawca:** Microsoft wymaga prawdziwych danych i akceptacji umowy przez uprawnionego posiadacza konta. Jeśli publikację prowadzi osoba niepełnoletnia, formalności i zgody musi zorganizować odpowiedzialny dorosły zgodnie z warunkami programu. Nie pomagamy omijać wymagań wieku ani weryfikacji.
- **Dane profilu:** synchronizacja dobrowolnie przetwarza pseudonim, obraz profilu, preferencje i identyfikator konta; potrzebna jest odpowiednia, dostępna użytkownikowi polityka prywatności i możliwość usunięcia profilu.
- **Minecraft:** aplikacja niezależna, niepowiązana z Mojang ani Microsoft; nie sugerować oficjalnej afiliacji.
- **Bezpieczeństwo:** MSIX ze sklepu jest podpisany dopiero **po zatwierdzeniu**. Nie wyłączaj Windows Smart App Control i nie używaj certyfikatów samopodpisanych do dystrybucji publicznej.
- **Weryfikacja:** pakiet zawiera Win32 full trust (`runFullTrust`); konieczne są testy procesów potomnych QtWebEngine, zapisu do danych użytkownika i uruchamiania gry oraz zgodność ze zasadami sklepu.
- **Update:** nowe pakiety zachowują tę samą Name, Publisher i Application Id, a numer wersji musi rosnąć.

## Linki dokumentacji Microsoft

- https://learn.microsoft.com/pl-pl/windows/apps/publish/faq/get-started-with-the-microsoft-store
- https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/upload-app-packages
- https://learn.microsoft.com/en-us/windows/msix/package/create-app-package-with-makeappx-tool
- https://learn.microsoft.com/en-us/windows/uwp/app-resources/using-mrt-for-converted-desktop-apps-and-games
