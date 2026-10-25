"""MINEVORA desktop cloud profile: separate Microsoft delegated API access.

Never reuse Minecraft game tokens as website API credentials. This module keeps
MSAL tokens in memory only; no refresh tokens, passwords, auth codes or full
authorize URLs are written to local profile data or diagnostic logs.
"""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.request

API_ENDPOINT = "https://wandering-cell-cf47minevora-profile-api.niedospialirek855.workers.dev/v1/profile"
API_CLIENT_ID = "72a4154b-5254-4c4b-958f-0a5181a0ad93"
API_SCOPE = "api://9136b5e6-145b-40d0-bbc4-dca668321195/profile.sync"
AUTHORITY = "https://login.microsoftonline.com/consumers"
VALID_MODES = frozenset(("BedWars", "SkyWars", "Crystal PvP", "Parkour", "TNT Run",
                         "Build Battle", "Spleef", "Duels"))
VALID_COLORS = frozenset(("purple", "blue", "teal", "rose"))
MAX_AVATAR_LENGTH = 400_000
MAX_RESPONSE_BYTES = 500_000


def validate_profile(value):
    """Return only accepted non-sensitive profile fields, fail closed on invalid data."""
    if not isinstance(value, dict):
        raise ValueError("Niepoprawny profil MINEVORA.")
    nick, mode, color, avatar = (value.get("nickname"), value.get("mode"),
                                 value.get("color", "purple"), value.get("avatarData", ""))
    if not isinstance(nick, str) or not re.fullmatch(r"[A-Za-z0-9_-]{3,20}", nick):
        raise ValueError("Nieprawidłowy nick profilu.")
    if not isinstance(mode, str) or mode not in VALID_MODES:
        raise ValueError("Nieobsługiwana minigra w profilu.")
    if not isinstance(color, str) or color not in VALID_COLORS:
        raise ValueError("Nieobsługiwany kolor awatara.")
    if not isinstance(avatar, str) or len(avatar) > MAX_AVATAR_LENGTH:
        raise ValueError("Zdjęcie profilowe jest zbyt duże.")
    if avatar and not re.fullmatch(r"data:image/webp;base64,[A-Za-z0-9+/]+={0,2}", avatar):
        raise ValueError("Niewłaściwy format zdjęcia profilowego.")
    return {"nickname": nick, "mode": mode, "color": color, "avatarData": avatar}


class MicrosoftProfileSession:
    """Dedicated Microsoft login for profile.sync, independent of Minecraft Java."""

    def __init__(self, client_factory=None):
        self._client_factory = client_factory
        self._app = None

    def access_token(self):
        if self._app is None:
            factory = self._client_factory
            if factory is None:
                import msal
                factory = msal.PublicClientApplication
            self._app = factory(API_CLIENT_ID, authority=AUTHORITY)
        app = self._app
        result = None
        accounts = app.get_accounts()
        if accounts:
            result = app.acquire_token_silent([API_SCOPE], account=accounts[0])
        if not result:
            # Uses an automatically generated loopback port and the precise
            # desktop redirect URI http://localhost (registered by app owner).
            # Official MSAL Python interactive auth uses PKCE automatically.
            result = app.acquire_token_interactive(
                scopes=[API_SCOPE], prompt="select_account", timeout=180
            )
        if not isinstance(result, dict) or not isinstance(result.get("access_token"), str):
            code = result.get("error", "oauth_failed") if isinstance(result, dict) else "oauth_failed"
            code = re.sub(r"[^a-zA-Z0-9_]", "", str(code))[:60]
            raise RuntimeError("Nie udało się uzyskać zgody Microsoft profile.sync (kod: " + code + ").")
        return result["access_token"]

    def disconnect(self):
        # Do not persist account/token cache across launches.
        self._app = None


class RejectRedirect(urllib.request.HTTPRedirectHandler):
    """Do not forward Authorization headers to a redirect destination."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def call_profile_api(token, method="GET", value=None, opener=None):
    if method not in ("GET", "PUT", "DELETE"):
        raise ValueError("Niedozwolona operacja synchronizacji.")
    if not isinstance(token, str) or not token:
        raise ValueError("Brak tokenu uwierzytelnienia Microsoft.")
    headers = {"Authorization": "Bearer " + token, "Accept": "application/json"}
    body = None
    if method == "PUT":
        headers["Content-Type"] = "application/json"
        body = json.dumps(validate_profile(value), ensure_ascii=False).encode("utf-8")
        if len(body) > MAX_RESPONSE_BYTES:
            raise ValueError("Profil przekracza limit API.")
    request = urllib.request.Request(API_ENDPOINT, headers=headers,
                                     data=body, method=method)
    opener = opener if opener is not None else urllib.request.build_opener(RejectRedirect())
    try:
        response = opener.open(request, timeout=25)
        with response:
            if response.geturl() != API_ENDPOINT:
                raise RuntimeError("Nieoczekiwane przekierowanie podczas synchronizacji.")
            content = response.read(MAX_RESPONSE_BYTES + 1)
            if len(content) > MAX_RESPONSE_BYTES:
                raise ValueError("Odpowiedź API jest zbyt duża.")
            result = json.loads(content.decode("utf-8"))
    except urllib.error.HTTPError as error:
        # Only show numeric status, never a raw HTTP body or token.
        if error.code == 401:
            raise RuntimeError("Microsoft nie autoryzował profilu. Spróbuj ponownie się zalogować.") from None
        if error.code == 503:
            raise RuntimeError("Chmura MINEVORA jest chwilowo niedostępna.") from None
        raise RuntimeError("Serwer profili odpowiedział kodem HTTP " + str(error.code)) from None
    except urllib.error.URLError:
        raise RuntimeError("Nie można połączyć się z chmurą MINEVORA.") from None
    except (UnicodeError, ValueError):
        raise RuntimeError("Serwer profili zwrócił nieprawidłową odpowiedź.") from None
    if not isinstance(result, dict):
        raise RuntimeError("Nieprawidłowa odpowiedź API.")
    if method == "GET":
        if result.get("profile") is None:
            return None
        return validate_profile(result["profile"])
    if method == "PUT" and result.get("saved") is True:
        return True
    if method == "DELETE" and result.get("deleted") is True:
        return True
    raise RuntimeError("Operacja nie została potwierdzona przez API.")
