"""MINEVORA Qt backend. Tokens are kept only in process memory."""
import json
import os
import re
import subprocess
import ctypes
import threading
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from auth_diagnostics import inspect_request

import minecraft_launcher_lib
from PySide6.QtCore import QThread, Signal

MC_DIR = Path(os.environ.get('APPDATA', str(Path.home()))) / '.minecraft'
CONFIG = Path(os.environ.get('APPDATA', str(Path.home()))) / 'MINEVORA' / 'config.json'
# Use localhost for a desktop app; this URI can be registered in the Entra portal.
# The loopback listener still binds only to 127.0.0.1.
DEFAULT_REDIRECT = 'http://localhost:8765/callback'
ALLOWED_REDIRECTS = ('http://localhost:8765/callback', 'http://127.0.0.1:8765/callback')


def redirect_uri():
    try:
        data = json.loads(CONFIG.read_text(encoding='utf-8'))
        saved = str(data.get('redirect_uri', DEFAULT_REDIRECT)).strip()
        return saved if saved in ALLOWED_REDIRECTS else DEFAULT_REDIRECT
    except (OSError, ValueError, TypeError):
        return DEFAULT_REDIRECT


def save_oauth_config(application_id, callback):
    if not re.fullmatch(r'[a-fA-F0-9-]{36}', application_id):
        raise ValueError('Client ID musi mieć format GUID (36 znaków).')
    if callback not in ALLOWED_REDIRECTS:
        raise ValueError('Dozwolony jest tylko lokalny adres /callback na porcie 8765.')
    CONFIG.parent.mkdir(parents=True, exist_ok=True)
    try:
        data = json.loads(CONFIG.read_text(encoding='utf-8'))
        if not isinstance(data, dict):data = {}
    except (OSError, ValueError, TypeError):
        data = {}
    data['client_id'] = application_id
    data['redirect_uri'] = callback
    CONFIG.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def client_id():
    try:
        return str(json.loads(CONFIG.read_text(encoding='utf-8')).get('client_id', '')).strip()
    except (OSError, ValueError, TypeError):
        return ''


def save_client_id(value):
    if not re.fullmatch(r'[a-fA-F0-9-]{36}', value):
        raise ValueError('Client ID musi mieć format GUID (36 znaków).')
    CONFIG.parent.mkdir(parents=True, exist_ok=True)
    data = {}
    try:
        data = json.loads(CONFIG.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        pass
    data['client_id'] = value
    CONFIG.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


class LoginWorker(QThread):
    done = Signal(object)
    error = Signal(str)
    status = Signal(str)

    def __init__(self, application_id, callback=DEFAULT_REDIRECT):
        super().__init__()
        if callback not in ALLOWED_REDIRECTS:
            raise ValueError('Niepoprawny adres lokalnego przekierowania Microsoft.')
        self.application_id = application_id
        self.callback = callback

    def run(self):
        try:
            ms = minecraft_launcher_lib.microsoft_account
            data = ms.get_secure_login_data(self.application_id, self.callback)
            # Some minecraft-launcher-lib versions return a tuple instead of a dict.
            if isinstance(data, tuple):
                if len(data) >= 3:
                    data = {'login_url': data[0], 'state': data[1], 'code_verifier': data[2]}
                else:
                    raise RuntimeError('Nieobsługiwany format danych OAuth. Zaktualizuj minecraft-launcher-lib.')
            if not isinstance(data, dict):
                raise RuntimeError('Nieobsługiwany format odpowiedzi OAuth.')
            # Fail early when a library update changes an OAuth parameter.
            # Never log or show the full login URL, state or code challenge.
            oauth = inspect_request(data.get('login_url',''), self.application_id, self.callback)
            if not oauth['https'] or not oauth['client_id_matches'] or not oauth['redirect_matches']:
                raise RuntimeError('Parametry logowania Microsoft różnią się od ustawień MINEVORA. Otwórz Ustawienia -> Sprawdź parametry Microsoft.')
            state = data.get('state')
            result = {}
            received = threading.Event()

            class Callback(BaseHTTPRequestHandler):
                def do_GET(self):
                    parsed = urllib.parse.urlparse(self.path)
                    if parsed.path != '/callback':
                        self.send_error(404)
                        return
                    values = urllib.parse.parse_qs(parsed.query)
                    result.update({key: values[key][0] for key in values if values[key]})
                    body = 'Mozesz wrocic do MINEVORA.'.encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/plain; charset=utf-8')
                    self.send_header('Content-Length', str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                    received.set()

                def log_message(self, *_):
                    pass

            try:
                server = HTTPServer(('127.0.0.1', 8765), Callback)
            except OSError as exc:
                raise RuntimeError('Port logowania 8765 jest zajęty lub zablokowany. Zamknij inną sesję launchera. '+str(exc)) from exc
            server.timeout = 1
            try:
                self.status.emit('Logowanie Microsoft — adres powrotu: '+self.callback)
                # The callback must ALSO be registered on the owner-controlled Entra app.
                # A random/third-party Client ID cannot be fixed by the launcher.
                if not isinstance(data.get('login_url'),str) or not data['login_url'].startswith('https://login.'):
                    raise RuntimeError('Niepoprawny adres logowania Microsoft.')
                if not webbrowser.open(data['login_url']):
                    raise RuntimeError('Nie udało się otworzyć domyślnej przeglądarki. Sprawdź jej ustawienia w Windows.')
                for _ in range(180):
                    if received.is_set():
                        break
                    server.handle_request()
            finally:
                server.server_close()
            if not received.is_set():
                raise RuntimeError('Przekroczono czas logowania (3 minuty).')
            if result.get('error'):
                raise RuntimeError(result.get('error_description', result['error']))
            if state and result.get('state') != state:
                raise RuntimeError('Nieprawidłowy stan logowania OAuth.')
            code = result.get('code')
            if not code:
                raise RuntimeError('Nie otrzymano kodu logowania.')
            session = ms.complete_login(self.application_id, None, self.callback, code, data.get('code_verifier'))
            if not isinstance(session,dict) or not all(session.get(k) for k in ('name','id','access_token')):
                raise RuntimeError('Logowanie nie zwróciło poprawnego profilu Minecraft Java.')
            self.done.emit(session)
        except Exception as exc:
            self.error.emit(str(exc))



def windows_memory_bytes():
    """Return (installed, currently available) physical RAM; never fails the launch."""
    if os.name != 'nt':
        return None
    try:
        from ctypes import wintypes
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [('dwLength', wintypes.DWORD), ('dwMemoryLoad', wintypes.DWORD),
                        ('ullTotalPhys', ctypes.c_ulonglong), ('ullAvailPhys', ctypes.c_ulonglong),
                        ('ullTotalPageFile', ctypes.c_ulonglong), ('ullAvailPageFile', ctypes.c_ulonglong),
                        ('ullTotalVirtual', ctypes.c_ulonglong), ('ullAvailVirtual', ctypes.c_ulonglong),
                        ('ullAvailExtendedVirtual', ctypes.c_ulonglong)]
        mem = MEMORYSTATUSEX()
        mem.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(mem)):
            return None
        return mem.ullTotalPhys, mem.ullAvailPhys
    except (OSError, ValueError, AttributeError):
        return None


def safe_ram_gb(requested, memory_bytes):
    """Leave headroom for Windows and applications; never increase requested RAM."""
    requested = max(2, min(32, int(requested)))
    if not memory_bytes:
        return requested
    total, available = memory_bytes
    gib = 1024 ** 3
    if total <= 0 or available <= 0:
        return requested
    upper = max(2, min(int(total / gib) - 3, int(available / gib) - 1))
    return max(2, min(requested, upper))


def crash_hint(text):
    """Display a local, non-destructive diagnostic from vanilla/Fabric launch output."""
    t = text.lower()
    if 'could not reserve enough space' in t or 'outofmemoryerror' in t or 'could not create the java virtual machine' in t:
        return 'Za malo wolnego RAM-u lub niepoprawne argumenty JVM. Ustaw 4 GB RAM w MINEVORA.'
    if 'unsupportedclassversionerror' in t or 'java 21' in t and 'required' in t:
        return 'Niezgodna wersja Javy. Minecraft 1.21.1 wymaga Java 21; sprawdz instalacje wersji gry.'
    if ('modresolutionexception' in t or 'incompatible mod set' in t or
            'fabric-api' in t and ('missing' in t or 'requires' in t or 'depends on' in t)):
        return 'Konflikt lub brak zaleznosci modow Fabric. Sprawdz folder mods i log.'
    if 'mixin' in t and ('failed' in t or 'error' in t):
        return 'Blad modow Mixin. Sprobuj uruchomic czysta instancje bez dodatkowych modow.'
    if 'glfw error' in t or 'opengl' in t and ('error' in t or 'not supported' in t):
        return 'Problem z OpenGL / sterownikiem karty graficznej.'
    if 'no such file or directory' in t or 'the system cannot find the file' in t:
        return 'Brak pliku Javy lub biblioteki. Sprobuj ponownie zainstalowac wybrana wersje Minecrafta.'
    return 'Minecraft zwrocil kod bledu. Szczegoly sa w dzienniku startu i logs/latest.log.'


def safe_log_excerpt(path, secrets=(), limit=6000):
    """Never show Microsoft access token in details surfaced by the launcher."""
    try:
        data = Path(path).read_bytes()[-16000:].decode('utf-8', errors='replace')[-limit:]
    except OSError:
        return ''
    for secret in secrets:
        if secret and len(secret) > 12:
            data = data.replace(secret, '[TOKEN UKRYTY]')
    return data


class PlayWorker(QThread):
    status = Signal(str)
    error = Signal(str)
    finished_game = Signal(int)
    crash_details = Signal(int, str, str, str)

    def __init__(self, version, ram_gb, session, game_dir=None):
        super().__init__()
        self.version, self.ram_gb, self.session = version, ram_gb, session
        self.game_dir = str(game_dir) if game_dir else str(MC_DIR)

    def run(self):
        try:
            if not self.session or not self.session.get('access_token'):
                raise RuntimeError('Najpierw zaloguj sie na konto Microsoft.')
            folder = Path(self.game_dir)
            folder.mkdir(parents=True, exist_ok=True)
            profile_file = MC_DIR / 'versions' / self.version / (self.version + '.json')
            if not profile_file.is_file():
                raise RuntimeError('Brakuje zainstalowanego profilu Minecraft: ' + self.version +
                                   '. Otworz Instancje i wybierz Zainstaluj Minecraft.')
            used_ram = safe_ram_gb(self.ram_gb, windows_memory_bytes())
            if used_ram != int(self.ram_gb):
                self.status.emit(f'RAM automatycznie zmniejszony: {self.ram_gb} -> {used_ram} GB (zostawiono pamiec dla Windows).')
            options = {
                'username': self.session['name'],
                'uuid': self.session['id'],
                'token': self.session['access_token'],
                'jvmArguments': [f'-Xmx{used_ram}G', '-Xms1G'],
                'gameDirectory': str(folder),
                'launcherName': 'MINEVORA',
                'launcherVersion': '19.2.0',
            }
            # minecraft-launcher-lib finds the Java runtime downloaded with Minecraft.
            command = minecraft_launcher_lib.command.get_minecraft_command(self.version, str(MC_DIR), options)
            # Never save command-line arguments: they contain the Microsoft access token.
            logs_folder = CONFIG.parent / 'logs'
            logs_folder.mkdir(parents=True, exist_ok=True)
            log_path = logs_folder / 'minecraft-last-launch.log'
            self.status.emit(f'Uruchamianie Minecraft {self.version} | RAM {used_ram} GB...')
            flags = getattr(subprocess, 'CREATE_NO_WINDOW', 0)
            # Previously stdout/stderr were sent to DEVNULL: no one could diagnose code 1.
            with open(log_path, 'wb') as output:
                process = subprocess.Popen(command, cwd=str(folder), stdout=output,
                                           stderr=subprocess.STDOUT, creationflags=flags)
                self.status.emit(f'Minecraft uruchomiony | PID {process.pid} | dziennik: {log_path}')
                code = process.wait()
            if code != 0:
                latest = folder / 'logs' / 'latest.log'
                partial = safe_log_excerpt(log_path, [self.session.get('access_token')])
                # If Java stdout was empty, use instance's Minecraft log.
                details = partial or safe_log_excerpt(latest, [self.session.get('access_token')])
                self.crash_details.emit(code, crash_hint(details), str(log_path), details)
            self.finished_game.emit(code)
        except Exception as exc:
            self.error.emit(str(exc))
