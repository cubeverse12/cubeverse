"""Safe local settings bridge for MINEVORA PvP HUD (Fabric Minecraft 1.21.1).

Updates the existing HUD JSON for the selected game instance; it never edits
Minecraft health, hunger, inventory or server state.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from core import game_path

SUPPORTED_VERSION = "1.21.1"
SUPPORTED_LOADER = "fabric"
FLAGS = ("showHealth", "showHunger", "showFoodCount")
DEFAULTS = {"showHealth": True, "showHunger": True, "showFoodCount": True}


def _path(profile):
    if not isinstance(profile, dict) or profile.get("version") != SUPPORTED_VERSION or profile.get("loader") != SUPPORTED_LOADER:
        raise ValueError("HP, głód i jedzenie: wymagany Fabric 1.21.1 z MINEVORA PvP HUD 2.0.15+.")
    return game_path(profile) / "config" / "minevora_pvp.json"


def read_settings(profile):
    path = _path(profile)
    if not path.is_file():
        return dict(DEFAULTS)
    if path.stat().st_size > 100_000:
        raise ValueError("Plik ustawień moda jest zbyt duży.")
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("Niepoprawne ustawienia MINEVORA PvP HUD.")
    controls = value.get("_minevora_ui") or {}
    if not isinstance(controls, dict):
        raise ValueError("Niepoprawna sekcja HUD.")
    return {key: controls[key] if type(controls.get(key)) is bool else DEFAULTS[key] for key in FLAGS}


def save_settings(profile, chosen):
    path = _path(profile)
    if not isinstance(chosen, dict) or any(type(chosen.get(key)) is not bool for key in FLAGS):
        raise ValueError("Każdy przełącznik HUD musi być włączony albo wyłączony.")
    path.parent.mkdir(parents=True, exist_ok=True)
    source = {}
    if path.exists():
        if path.stat().st_size > 100_000:
            raise ValueError("Plik ustawień moda jest zbyt duży.")
        source = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(source, dict):
            raise ValueError("Niepoprawny plik moda — nic nie nadpisano.")
    ui = source.get("_minevora_ui") or {}
    if not isinstance(ui, dict):
        raise ValueError("Niepoprawny plik HUD — nic nie nadpisano.")
    ui.update({key: chosen[key] for key in FLAGS})
    source["_minevora_ui"] = ui
    content = json.dumps(source, ensure_ascii=False, indent=2)
    if len(content.encode("utf-8")) > 100_000:
        raise ValueError("Ustawienia modułu są za duże.")
    temp = path.with_name("minevora_pvp.json.launcher_tmp")
    try:
        with open(temp, "w", encoding="utf-8") as out:
            out.write(content)
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)
    return read_settings(profile)
