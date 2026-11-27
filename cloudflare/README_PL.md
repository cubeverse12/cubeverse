# MINEVORA — prywatna synchronizacja profilu (Cloudflare Free)

**Status: kod demonstracyjny. Nie jest wdrożony ani podłączony do strony i launchera.** Strona GitHub Pages z działającym logowaniem Microsoft pozostaje bez zmian.

## Konfiguracja istniejącej instancji (24.10.2026)

Baza `minevora-profiles` i Worker `wandering-cell-cf47minevora-profile-api` już zostały utworzone przez właściciela projektu w panelu Cloudflare. Zmienna produkcyjna `MS_API_AUDIENCE` oraz binding D1 `DB` są skonfigurowane. Plik `wrangler.jsonc` w tej gałęzi wskazuje dokładnie istniejący Worker i identyfikator istniejącej bazy, więc **nie uruchamiaj ponownie `d1 create`**.

Aby podpiąć kod bez ręcznego wklejania modułów NPM:

1. W Cloudflare wybierz istniejący Worker → **Settings → Builds → Connect** → **GitHub** i połącz tylko repozytorium `cubeverse12/cubeverse` (autoryzację zatwierdza użytkownik).
2. Wybierz produkcyjną gałąź **`codex/minevora-profile-sync-cloudflare-20261024`**, a katalog główny projektu (**Root directory**) ustaw na **`cloudflare`**.
3. Pole **Build command** pozostaw puste (o ile automatyczna instalacja NPM działa), zaś **Deploy command** ustaw na `npx wrangler deploy`.
4. Sprawdź nazwę Workera — musi być identyczna z polem `name` w `wrangler.jsonc`. Zapisz połączenie i uruchom Build/Deploy. Jeżeli panel wymaga nowego commitu, zmianę w gałęzi wykonaj dopiero po skonfigurowaniu projektu.
5. Po opublikowaniu sprawdź `/health`, bez wpisywania jakichkolwiek tokenów. **Działający endpoint /health nie oznacza jeszcze gotowej synchronizacji**, bo wymagany zakres `profile.sync` i klienckie żądania API nie są jeszcze skonfigurowane.

Nie przenoś produkcyjnej gałęzi strony `main` do Cloudflare Workers. Nie dodawaj haseł, tokenów dostępu ani kluczy API do repozytorium.

## Architektura

- **GitHub Pages**: publiczny interfejs MINEVORA, dotychczasowe logowanie MSAL.
- **Microsoft Entra**: uwierzytelnienie osobistych kont Microsoft. Do prywatnego API używamy *tokenu dostępu* dla uprawnienia `profile.sync`, nie ID tokenu i nie tokenu Microsoft Graph.
- **Cloudflare Workers Free**: endpoint HTTPS `/v1/profile` (GET, PUT, DELETE). Każde żądanie weryfikuje podpis JWT, wystawcę konsumenckiego, odbiorcę, ważność i wymagany zakres dostępu.
- **Cloudflare D1**: rekord konta identyfikowany przez zweryfikowaną wartość `sub` (z tokenu przeznaczonego dla tego API). Nick, ulubiona minigra, kolor awatara i dobrowolnie dodane zdjęcie WebP.
- **Brak kont publicznych**: brak API wyszukiwania innych graczy, brak e-maili i haseł w bazie; `DELETE` usuwa własny rekord.

## Kroki, których właściciel projektu jeszcze musi dokonać

### 1. Cloudflare

Użyj własnego uprawnionego konta Cloudflare (jeśli usługa wymaga osoby pełnoletniej, poproś rodzica/opiekuna o pomoc). Wersje darmowe Workers i D1 mają limity; monitoruj zużycie, nie uruchamiaj płatnego planu bez świadomej zgody.

W folderze `cloudflare`:

```bash
npm install
npx wrangler login
npx wrangler d1 create minevora-profiles
```

Skopiuj **ID bazy D1** otrzymane od Cloudflare do pola `database_id` w `wrangler.jsonc` (zastąp `REPLACE_WITH_D1_DATABASE_ID`). To identyfikator, nie hasło.

```bash
npx wrangler d1 migrations apply DB --remote
npm test
npx wrangler deploy
```

Zapisz publiczny adres w formacie `https://minevora-profile-api.<twoja-subdomena>.workers.dev`. **Nie wysyłaj żadnych tokenów, haseł, plików .env ani prywatnych kluczy.**

### 2. Microsoft Entra — osobne uprawnienie API

Nie zmieniaj działających adresów powrotu SPA. W konfiguracji aplikacji Microsoft Entra **MINEVORA Launcher** utwórz delegowany zakres dla własnego API:

- W **Uwidocznij interfejs API / Expose an API** ustaw identyfikator URI aplikacji API, np. `api://72a4154b-5254-4c4b-958f-0a5181a0ad93`, o ile Entra go zaakceptuje.
- Utwórz delegowany zakres `profile.sync`, dostępny za zgodą użytkownika.
- Skonfiguruj wersję tokenów dostępu **v2.0** dla aplikacji API (`requestedAccessTokenVersion` = `2`, jeśli dotyczy formularza manifestu).
- `MS_API_AUDIENCE` w `wrangler.jsonc` odpowiada **ID aplikacji API**, nie identyfikatorowi Microsoft Graph.
- Uprawnienie klienckie do API musi być poprawnie zatwierdzone dla wywołań `api://72a4154b-5254-4c4b-958f-0a5181a0ad93/profile.sync` przez MSAL.

Uwaga: sama aktywna sesja Microsoft na stronie jeszcze nie upoważnia do zapisów w bazie. W kolejnym etapie trzeba bezpiecznie uzyskać *access token* z tym zakresem i dołączyć go wyłącznie jako nagłówek `Authorization: Bearer …` wysyłany do własnego HTTPS API. Tokeny nigdy nie trafiają do URL, localStorage aplikacji ani plików profilu.

### 3. Integracja strony i launchera

Po potwierdzeniu działania API i konfiguracji scope:

1. Użytkownik w profilu włącza dobrowolną opcję **Synchronizuj profil**.
2. Strona używa MSAL `acquireTokenSilent` dla zakresu `api://.../profile.sync`, a gdy potrzeba — interaktywnej prośby o zgodę. Nie należy automatycznie logować się ponownie.
3. `GET /v1/profile` pobiera dane, `PUT /v1/profile` zapisuje, a `DELETE /v1/profile` usuwa dane w chmurze.
4. Launcher osobno uzyskuje token do tego *samego* API przez bezpieczny Microsoft OAuth PKCE i przedstawia go usłudze; token dostępu do samej gry Minecraft Java nie może być używany w API profilu.

W aktualnym stanie **strona i launcher nie synchronizują się automatycznie**. Nie włączaj synchronizacji, dopóki pełna ścieżka tokenów nie zostanie przetestowana z prawdziwym kontem.

## Testy

```bash
cd cloudflare
npm install
npm test
```

Testy sprawdzają poprawność profilu, blokowanie innych originów, 401 bez uprawnionego tokenu, izolację kont, usuwanie rekordu i CORS. Nie zastępują testów integracyjnych prawdziwych tokenów MSAL/Entra ani testu środowiska Cloudflare.

## Prywatność

Zdjęcie profilowe jest opcjonalne. D1 przechowuje jego kopię dopóki użytkownik jej nie zastąpi lub nie skasuje profilu. Przed publicznym udostępnieniem należy przygotować krótką informację o danych i retencji, kontrolę kosztów i nadużyć, regulamin oraz proces zgłaszania usunięcia danych. Nie udostępniaj prywatnych tokenów w GitHub, na Discordzie ani w zrzutach ekranu.
