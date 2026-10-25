"""MINEVORA desktop: the same HTML/CSS/JS as the GitHub Pages site, with native Minecraft actions.
Run from the repository checkout on Windows. No passwords or access tokens are stored.
"""
from __future__ import annotations

import base64
import json
import re
import sys
from pathlib import Path

from PySide6.QtCore import QObject, QThread, Qt, QTimer, QUrl, Signal, Slot
from PySide6.QtGui import QDesktopServices, QImage, QPainter
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtWebEngineCore import QWebEnginePage, QWebEngineSettings
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWidgets import QApplication, QMainWindow, QMessageBox, QFileDialog, QInputDialog

from backend import install_profile, official_releases, free_disk_gb
from cloud_profile import MicrosoftProfileSession, call_profile_api, validate_profile
from core import (HOME, MC_DIR, game_path, instance_id, profile_installed,
                  read_store, safe_name, save_store, selected_instance)
from minevora_engine import (LoginWorker, PlayWorker, client_id, redirect_uri,
                             save_oauth_config)

REPO = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent.parent))
STATIC_PAGE = REPO / "index.html"
BRIDGE_FILE = (REPO / "desktop" / "native-bridge.js") if getattr(sys, "frozen", False) else Path(__file__).with_name("native-bridge.js")
LOADER_NAMES = ("vanilla", "fabric", "forge", "neoforge", "quilt")
VERSION_PATTERN = re.compile(r"\d+\.\d+(?:\.\d+)?\Z")


class Job(QThread):
    done = Signal(object)
    failed = Signal(str)
    status = Signal(str)

    def __init__(self, fn):
        super().__init__()
        self.fn = fn

    def run(self):
        try:
            self.done.emit(self.fn(self.status.emit))
        except Exception as exc:
            self.failed.emit(str(exc))


class LocalOnlyPage(QWebEnginePage):
    """The privileged bridge is exposed only to the bundled local HTML page."""

    def acceptNavigationRequest(self, url, nav_type, is_main_frame):
        if not is_main_frame:
            return super().acceptNavigationRequest(url, nav_type, is_main_frame)
        if url.isLocalFile():
            return Path(url.toLocalFile()).resolve() == STATIC_PAGE.resolve()
        if url.scheme() in ("http", "https"):
            QDesktopServices.openUrl(url)
            return False
        return False


class NativeLauncher(QObject):
    event = Signal(str)

    def __init__(self, window):
        super().__init__(window)
        self.window = window
        self.data = read_store()
        self.session = None
        self.jobs = []
        self.login_job = None
        self.game_job = None
        self.batch_stop = False
        self.bulk_busy = False
        self.game_busy = False
        self.available_versions = []
        self.initial_prompted = False
        self.pending_launch = None
        self.cloud_session = MicrosoftProfileSession()
        self.cloud_job = None

    def emit_state(self, kind, **values):
        self.event.emit(json.dumps({"kind": kind, **values}, ensure_ascii=False))

    def status(self, message):
        self.emit_state("status", message=str(message))

    def error(self, message):
        self.emit_state("error", message=str(message))
        QMessageBox.warning(self.window, "MINEVORA", str(message))

    def profiles(self):
        self.emit_state("profiles", profiles=[
            {"id": p["id"], "name": p["name"], "version": p["version"],
             "loader": p["loader"], "installed": profile_installed(p)}
            for p in self.data["instances"]
        ], selected=self.data.get("selected", ""))

    def busy(self):
        return any(job.isRunning() for job in self.jobs) or self.bulk_busy

    def run_job(self, label, fn, on_done):
        if self.busy():
            self.status("Poczekaj na zakończenie bieżącej instalacji.")
            return
        self.status(label)
        job = Job(fn)
        self.jobs.append(job)
        job.status.connect(self.status)
        job.done.connect(on_done)
        job.failed.connect(self.error)
        job.finished.connect(lambda: self.jobs.remove(job) if job in self.jobs else None)
        job.start()

    @Slot(str, str)
    def send(self, action, payload):
        try:
            args = json.loads(payload) if payload else {}
            if not isinstance(args, dict):
                raise ValueError("Niepoprawne dane polecenia")
            routes = {
                "ready": lambda: self.ready(),
                "versions": self.fetch_versions,
                "create_profile": lambda: self.create_profile(args),
                "install": lambda: self.install(args),
                "play": lambda: self.play(args),
                "login": self.login,
                "skin": self.import_skin,
                "bulk": self.install_everything,
                "stop_bulk": self.stop_bulk,
                "profile_import": self.import_web_profile,
                "cloud_pull": self.cloud_pull,
                "cloud_push": self.cloud_push,
                "cloud_disconnect": self.cloud_disconnect,
                "web_account": self.open_web_account,
            }
            if action not in routes:
                raise ValueError("Nieobsługiwane polecenie: " + action[:40])
            routes[action]()
        except (ValueError, OSError, KeyError, TypeError) as exc:
            self.error(str(exc))

    def ready(self):
        self.profiles()
        if isinstance(self.data.get("web_profile"), dict):
            self.emit_state("minevora_profile", **self.data["web_profile"])
        self.fetch_versions()
        # Bulk installation is opt-in. Never prompt automatically at startup.

    def fetch_versions(self):
        def finished(versions):
            self.available_versions = versions
            self.emit_state("versions", values=versions)
            self.status(f"Dostępnych stabilnych wydań: {len(versions)}")
        self.run_job("Pobieranie oficjalnej listy Minecraft…",
                     lambda progress: official_releases(), finished)

    def normalize(self, args):
        version = str(args.get("version", "")).strip()
        loader = str(args.get("loader", "vanilla")).strip().lower()
        if not VERSION_PATTERN.fullmatch(version):
            raise ValueError("Nieprawidłowa wersja Minecrafta")
        if loader not in LOADER_NAMES:
            raise ValueError("Nieobsługiwany loader")
        return version, loader

    def ensure_profile(self, version, loader, name=None):
        matching = next((p for p in self.data["instances"]
                         if p["version"] == version and p["loader"] == loader), None)
        if matching is not None:
            self.data["selected"] = matching["id"]
            save_store(self.data)
            self.profiles()
            return matching
        if len(self.data["instances"]) >= 100:
            raise ValueError("Osiągnięto limit 100 profili")
        display = safe_name(name or f"MINEVORA {version} {loader}")
        profile = {"id": instance_id(display), "name": display, "version": version,
                   "loader": loader, "game_id": ""}
        records_path = HOME / "bulk_installed.json"
        if records_path.is_file():
            try:
                records = json.loads(records_path.read_text(encoding="utf-8"))
                found = next((r for r in records
                              if r.get("version") == version and r.get("loader") == loader), None)
                if found:
                    profile["game_id"] = str(found.get("game_id", ""))
            except (OSError, ValueError, TypeError):
                pass
        self.data["instances"].append(profile)
        self.data["selected"] = profile["id"]
        save_store(self.data)
        self.profiles()
        return profile

    def create_profile(self, args):
        version, loader = self.normalize(args)
        name = safe_name(args.get("name") or f"MINEVORA {version}")
        self.ensure_profile(version, loader, name)
        self.status("Profil został zapisany. Wybierz instalację lub GRAJ.")

    def install(self, args):
        version, loader = self.normalize(args)
        profile = self.ensure_profile(version, loader)
        if profile_installed(profile):
            self.status(f"Minecraft {version} / {loader} jest już zainstalowany.")
            return
        ident = profile["id"]
        snapshot = dict(profile)

        def done(result):
            saved = next((p for p in self.data["instances"] if p["id"] == ident), None)
            if saved:
                saved["game_id"] = result["id"]
                save_store(self.data)
            self.profiles()
            warnings = result.get("warnings", [])
            self.status("Instalacja ukończona." + (" Uwagi: " + "; ".join(warnings) if warnings else ""))
            if self.pending_launch == (version, loader):
                QTimer.singleShot(250, lambda: self.play({"version": version, "loader": loader}))
        self.run_job(f"Instalowanie Minecraft {version} / {loader}…",
                     lambda report: install_profile(snapshot, report), done)

    def login(self):
        if self.login_job and self.login_job.isRunning():
            self.status("Logowanie Microsoft już trwa.")
            return
        application_id = client_id()
        if not application_id:
            application_id, ok = QInputDialog.getText(
                self.window, "MINEVORA / Microsoft", "Client ID własnej aplikacji Entra (GUID):")
            if not ok:
                return
            save_oauth_config(application_id.strip(), redirect_uri())
        self.login_job = LoginWorker(client_id(), redirect_uri())
        self.login_job.status.connect(self.status)
        self.login_job.error.connect(self.error)

        def logged_in(session):
            self.session = session
            self.emit_state("account", name=session.get("name", "Minecraft"))
            self.status("Zalogowano do konta Minecraft: " + session.get("name", ""))
            if self.pending_launch:
                version, loader = self.pending_launch
                QTimer.singleShot(250, lambda: self.play({"version": version, "loader": loader}))
        self.login_job.done.connect(logged_in)
        self.login_job.start()

    def play(self, args):
        if self.game_busy:
            self.status("Minecraft już jest uruchomiony.")
            return
        version, loader = self.normalize(args)
        profile = self.ensure_profile(version, loader)
        if not profile_installed(profile):
            self.pending_launch = (version, loader)
            self.status("Ta wersja nie jest jeszcze pobrana. Rozpoczynam instalację.")
            self.install(args)
            return
        if not self.session:
            self.status("Zaloguj się przez Microsoft, aby uruchomić grę.")
            self.login()
            return
        self.pending_launch = None
        self.game_job = PlayWorker(profile["game_id"], self.data.get("ram", 4),
                                   self.session, game_path(profile))
        self.game_busy = True
        self.game_job.status.connect(self.status)
        self.game_job.error.connect(self.game_error)
        self.game_job.finished_game.connect(self.game_finished)
        self.game_job.crash_details.connect(
            lambda code, hint, logfile, output: self.status(
                f"Minecraft zakończył się błędem {code}. {hint} Log: {logfile}"))
        self.game_job.start()

    def game_error(self, message):
        self.game_busy = False
        self.error(message)

    def game_finished(self, code):
        self.game_busy = False
        self.status("Minecraft zamknięty." if code == 0 else f"Minecraft: kod wyjścia {code}.")

    def import_skin(self):
        file, _ = QFileDialog.getOpenFileName(
            self.window, "Wybierz skin Minecraft", str(Path.home()), "PNG (*.png)")
        if not file:
            return
        if Path(file).stat().st_size > 4 * 1024 * 1024:
            raise ValueError("Plik skina jest zbyt duży (limit 4 MB).")
        image = QImage(file)
        if image.isNull() or image.width() != 64 or image.height() not in (32, 64):
            raise ValueError("Skin musi mieć wymiary 64×64 lub 64×32.")
        if image.height() == 32:
            # The website renderer expects a 64×64 atlas. Old-format missing
            # limb regions remain transparent; no arbitrary UVs are invented.
            expanded = QImage(64, 64, QImage.Format_ARGB32)
            expanded.fill(Qt.transparent)
            painter = QPainter(expanded)
            painter.drawImage(0, 0, image)
            painter.end()
            image = expanded
        dest = HOME / "skins" / "avatar.png"
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not image.save(str(dest), "PNG"):
            raise OSError("Nie udało się zapisać skina.")
        self.data["skin"] = str(dest)
        save_store(self.data)
        encoded = base64.b64encode(dest.read_bytes()).decode("ascii")
        self.emit_state("skin", url="data:image/png;base64," + encoded)
        self.status("Skin PNG zapisany i przekazany do podglądu 3D.")

    def open_web_account(self):
        # Fixed official project URL; the local page cannot choose arbitrary URLs.
        if not QDesktopServices.openUrl(QUrl("https://cubeverse12.github.io/cubeverse/#account")):
            self.error("Nie udało się otworzyć konta MINEVORA w przeglądarce.")

    def import_web_profile(self):
        """Import a consent-based profile export; no Microsoft tokens involved."""
        path, _ = QFileDialog.getOpenFileName(
            self.window, "Importuj profil MINEVORA", str(Path.home()), "Profil JSON (*.json)")
        if not path:
            return
        source = Path(path)
        if source.stat().st_size > 550_000:
            raise ValueError("Profil WWW jest zbyt duży.")
        doc = json.loads(source.read_text(encoding="utf-8-sig"))
        if not isinstance(doc, dict) or doc.get("format") != "minevora-profile-v1":
            raise ValueError("Nieprawidłowy format eksportu MINEVORA.")
        nickname = str(doc.get("nickname", ""))
        if not re.fullmatch(r"[A-Za-z0-9_-]{3,20}", nickname):
            raise ValueError("Nick musi mieć 3–20 znaków.")
        avatar = str(doc.get("avatarData", ""))
        if avatar and (len(avatar) > 400_000 or
                       not re.fullmatch(r"data:image/webp;base64,[A-Za-z0-9+/=]+", avatar)):
            raise ValueError("Nieprawidłowe zdjęcie profilu.")
        favorite = str(doc.get("mode", "BedWars"))
        if favorite not in ("BedWars", "SkyWars", "Crystal PvP", "Parkour",
                            "TNT Run", "Build Battle", "Spleef", "Duels"):
            favorite = "BedWars"
        profile = {"nickname": nickname, "avatarData": avatar, "mode": favorite,
                   "color": str(doc.get("color", "purple"))}
        self.data["web_profile"] = profile
        save_store(self.data)
        self.emit_state("minevora_profile", **profile)
        self.status("Profil zaimportowany lokalnie. Możesz go dobrowolnie wysłać do chmury.")

    def run_cloud_job(self, label, method, payload=None):
        """Microsoft login + HTTPS request run outside the Qt UI thread."""
        if self.cloud_job and self.cloud_job.isRunning():
            self.status("Poczekaj na zakończenie synchronizacji profilu.")
            return
        self.status(label)
        def task(_progress):
            token = self.cloud_session.access_token()
            # Never return or log a Microsoft token; only the validated profile.
            return call_profile_api(token, method=method, value=payload)
        job = Job(task)
        self.cloud_job = job
        job.status.connect(self.status)
        def failed(message):
            # Do not leak internal library traces or OAuth response content.
            self.status("Synchronizacja MINEVORA nie powiodła się. " +
                        (message[:180] if "token" not in message.lower() else
                         "Spróbuj ponownie po zalogowaniu."))
            self.emit_state("cloud_sync", ok=False)
        job.failed.connect(failed)
        def finished(result):
            if method == "GET":
                if result is None:
                    self.status("Brak profilu w chmurze. Najpierw zapisz profil na stronie.")
                    self.emit_state("cloud_sync", ok=True, empty=True)
                    return
                local = validate_profile(result)
                self.data["web_profile"] = local
                save_store(self.data)
                self.emit_state("minevora_profile", **local)
                self.status("Profil MINEVORA pobrany z chmury i zapisany lokalnie.")
            elif method == "PUT":
                self.status("Profil MINEVORA wysłany do chmury.")
            self.emit_state("cloud_sync", ok=True, empty=False)
        job.done.connect(finished)
        job.finished.connect(lambda: setattr(self, "cloud_job", None))
        job.start()

    def cloud_pull(self):
        if self.cloud_job and self.cloud_job.isRunning():
            self.status("Synchronizacja już trwa.")
            return
        existing = self.data.get("web_profile")
        if existing:
            answer = QMessageBox.question(
                self.window, "MINEVORA / Cloudflare",
                "Pobrać profil z chmury i zastąpić lokalny nick, kolor oraz zdjęcie w launcherze? "
                "Dane na stronie internetowej pozostaną bez zmian.",
                QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
            if answer != QMessageBox.Yes:
                return
        self.run_cloud_job("Otwieram bezpieczne logowanie Microsoft do profilu MINEVORA…", "GET")

    def cloud_push(self):
        if self.cloud_job and self.cloud_job.isRunning():
            self.status("Synchronizacja już trwa.")
            return
        local = self.data.get("web_profile")
        if not local:
            self.status("Najpierw pobierz profil z chmury lub zaimportuj lokalny profil.")
            return
        profile = validate_profile(local)
        answer = QMessageBox.question(
            self.window, "MINEVORA / Cloudflare",
            "Wysłać lokalne dane profilu (nick, zdjęcie, kolor i ulubioną minigrę) "
            "do Cloudflare? Zastąpią zapis profilu w chmurze.",
            QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        if answer != QMessageBox.Yes:
            return
        self.run_cloud_job("Łączenie z kontem Microsoft i zapisywanie profilu w chmurze…",
                           "PUT", profile)

    def cloud_disconnect(self):
        if self.cloud_job and self.cloud_job.isRunning():
            self.status("Zaczekaj na koniec synchronizacji przed odłączeniem.")
            return
        self.cloud_session.disconnect()
        self.status("Rozłączono sesję profilu MINEVORA w launcherze (bez usuwania chmury).")

    def offer_initial_bulk(self):
        marker = HOME / "web_desktop_first_run.json"
        if marker.exists():
            return
        marker.parent.mkdir(parents=True, exist_ok=True)
        result = QMessageBox.question(
            self.window, "MINEVORA — pierwsze uruchomienie",
            "Czy pobrać WSZYSTKIE stabilne wydania Minecrafta i zgodne loadery?\n\n"
            "Może to zająć wiele godzin oraz dziesiątki lub setki GB. "
            "Możesz zrobić to później w Instalacjach.",
            QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        marker.write_text(json.dumps({"asked": True}), encoding="utf-8")
        if result == QMessageBox.Yes:
            self.install_everything()

    def install_everything(self):
        if self.busy() or self.game_busy:
            self.status("Zakończ bieżącą operację przed instalacją zbiorczą.")
            return
        if free_disk_gb(HOME) < 50:
            self.error("Za mało wolnego miejsca: przed pobraniem potrzeba co najmniej 50 GB.")
            return
        decision = QMessageBox.question(
            self.window, "MINEVORA — instalacja zbiorcza",
            "Zainstalować wszystkie stabilne wersje i kompatybilne loadery?\n"
            "Może to potrwać wiele godzin. Przerwanie nastąpi po bieżącym pobraniu.",
            QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        if decision != QMessageBox.Yes:
            return
        self.batch_stop = False
        self.bulk_busy = True

        def task(progress):
            import minecraft_launcher_lib as m
            versions = official_releases()
            records, errors = [], []
            for idx, version in enumerate(versions):
                if self.batch_stop:
                    break
                for loader in LOADER_NAMES:
                    if self.batch_stop:
                        break
                    try:
                        if loader != "vanilla":
                            engine = m.mod_loader.get_mod_loader(loader)
                            if not engine.is_minecraft_version_supported(version):
                                continue
                        progress(f"{idx+1}/{len(versions)} • Minecraft {version} • {loader}")
                        profile = {"id": "0123456789abcdef", "name": "Auto",
                                   "version": version, "loader": loader}
                        result = install_profile(profile, progress, with_pvp=False)
                        records.append({"version": version, "loader": loader,
                                        "game_id": result["id"]})
                    except Exception as exc:
                        errors.append(f"{version}/{loader}: {str(exc)[:120]}")
            return {"records": records, "errors": errors,
                    "cancelled": self.batch_stop}

        job = Job(task)
        self.jobs.append(job)
        job.status.connect(self.status)
        job.failed.connect(self.error)

        def done(result):
            path = HOME / "bulk_installed.json"
            try:
                previous = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
                merged = {(r["version"], r["loader"]): r
                          for r in previous + result["records"]}
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(list(merged.values()), ensure_ascii=False, indent=2),
                                encoding="utf-8")
                for profile in self.data["instances"]:
                    entry = merged.get((profile["version"], profile["loader"]))
                    if entry and not profile_installed(profile):
                        profile["game_id"] = entry["game_id"]
                save_store(self.data)
            except (OSError, ValueError, KeyError, TypeError) as exc:
                result["errors"].append("Zapis: " + str(exc))
            if result["errors"]:
                logs = HOME / "logs"
                logs.mkdir(parents=True, exist_ok=True)
                (logs / "bulk-install-errors.txt").write_text(
                    "\n".join(result["errors"]), encoding="utf-8")
            self.profiles()
            self.status(f"Instalacje: {len(result['records'])}; błędy: "
                        f"{len(result['errors'])}; przerwano: {result['cancelled']}.")
            self.bulk_busy = False

        job.done.connect(done)
        job.finished.connect(lambda: self.jobs.remove(job) if job in self.jobs else None)
        job.finished.connect(lambda: setattr(self, "bulk_busy", False))
        job.start()

    def stop_bulk(self):
        self.batch_stop = True
        self.status("Przerwanie po zakończeniu bieżącej instalacji.")

class LauncherWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        if not STATIC_PAGE.is_file():
            raise FileNotFoundError("Brakuje index.html — pobierz całe repozytorium cubeverse.")
        self.setWindowTitle("MINEVORA — Launcher Windows")
        self.resize(1450, 850)
        self.setMinimumSize(1100, 680)
        self.web = QWebEngineView(self)
        self.setCentralWidget(self.web)
        self.native = NativeLauncher(self)
        self.channel = QWebChannel(self.web)
        self.channel.registerObject("nativeLauncher", self.native)
        page = LocalOnlyPage(self.web)
        page.setWebChannel(self.channel)
        page.settings().setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, False)
        self.web.setPage(page)
        self.web.loadFinished.connect(self.on_loaded)
        self.web.load(QUrl.fromLocalFile(str(STATIC_PAGE)))

    def on_loaded(self, ok):
        if not ok:
            QMessageBox.critical(self, "MINEVORA", "Nie udało się wczytać strony launchera.")
            return
        script = BRIDGE_FILE.read_text(encoding="utf-8")
        self.web.page().runJavaScript(script)

def main():
    app = QApplication(sys.argv)
    window = LauncherWindow()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
