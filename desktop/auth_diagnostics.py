"""Safety-limited OAuth request diagnostics for MINEVORA.

Never print the full authorization URL: it includes per-attempt state and PKCE
challenge; the final redirect will include an authorization code.
"""
from urllib.parse import urlparse, parse_qs


def inspect_request(login_url, configured_client_id, configured_redirect):
    """Return ONLY safe, predefined OAuth metadata, never the full URL."""
    parsed = urlparse(login_url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    query_client = params.get('client_id', [''])[0]
    query_redirect = params.get('redirect_uri', [''])[0]
    return {
        'host': parsed.hostname or '(brak)',
        'https': parsed.scheme == 'https',
        'client_id': query_client,
        'redirect_uri': query_redirect,
        'client_id_matches': query_client.lower() == configured_client_id.strip().lower(),
        'redirect_matches': query_redirect == configured_redirect.strip(),
    }


def report_for_microsoft(application_id, callback, microsoft_account):
    raw = microsoft_account.get_secure_login_data(application_id, callback)
    if isinstance(raw, tuple):
        if not raw or not isinstance(raw[0], str):
            raise RuntimeError('Biblioteka zwrocila nieprawidlowy adres logowania.')
        url = raw[0]
    elif isinstance(raw, dict):
        url = raw.get('login_url', '')
    else:
        raise RuntimeError('Nieobslugiwany wynik minecraft-launcher-lib.')
    return inspect_request(url, application_id, callback)


def readable_report(result):
    yes_no = lambda value: 'TAK' if value else 'NIE'
    output = [
        'MINEVORA - bezpieczna kontrola parametrow Microsoft OAuth',
        'Serwer logowania: ' + result['host'],
        'Polaczenie HTTPS: ' + yes_no(result['https']),
        'Client ID w zadaniu: ' + (result['client_id'] or '(brak)'),
        'Client ID zgodny z ustawieniami: ' + yes_no(result['client_id_matches']),
        'Redirect URI w zadaniu: ' + (result['redirect_uri'] or '(brak)'),
        'Redirect URI zgodny z ustawieniami: ' + yes_no(result['redirect_matches']),
    ]
    if not result['https'] or not result['client_id_matches'] or not result['redirect_matches']:
        output.append('WYKRYTO ROZNICE: launcher lub biblioteka uzywa innej konfiguracji.')
    else:
        output.append('Parametry sa zgodne lokalnie. To NIE potwierdza akceptacji przez Microsoft.')
        output.append('Jesli Microsoft odrzuca redirect_uri, sprawdz platforme i URI')
        output.append('w Microsoft Entra oraz czy w przegladarce otwarto NOWE logowanie.')
    output.append('Raport nie zawiera tokenow, state, kodow autoryzacyjnych ani pelnego URL.')
    return '\n'.join(output)
