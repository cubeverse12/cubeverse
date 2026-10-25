"""Offline tests: per-instance settings for the Fabric 1.21.1 MINEVORA PvP HUD."""
import json
import pathlib
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import pvp_hud_settings as mod


class HudSettingsTests(unittest.TestCase):
    profile = {"id": "abcd1234abcd1234", "version": "1.21.1", "loader": "fabric"}

    def test_defaults_if_not_yet_saved(self):
        with tempfile.TemporaryDirectory() as root, patch.object(mod, "game_path", return_value=pathlib.Path(root)):
            self.assertEqual(mod.read_settings(self.profile), mod.DEFAULTS)

    def test_preserves_other_module_settings_and_round_trips(self):
        with tempfile.TemporaryDirectory() as root, patch.object(mod, "game_path", return_value=pathlib.Path(root)):
            path = pathlib.Path(root) / "config" / "minevora_pvp.json"
            path.parent.mkdir()
            path.write_text(json.dumps({"Armor HUD": {"enabled": False},
                                        "_minevora_ui": {"hudScale": 0.75, "showHealth": True}}),
                            encoding="utf-8")
            value = {"showHealth": False, "showHunger": True, "showFoodCount": False}
            self.assertEqual(mod.save_settings(self.profile, value), value)
            self.assertEqual(mod.read_settings(self.profile), value)
            saved = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(saved["Armor HUD"], {"enabled": False})
            self.assertEqual(saved["_minevora_ui"]["hudScale"], 0.75)
            self.assertFalse(saved["_minevora_ui"]["showHealth"])

    def test_rejects_other_minecraft_versions_loaders(self):
        for variant in ({"version": "1.20.1", "loader": "fabric"},
                        {"version": "1.21.1", "loader": "vanilla"},
                        {"version": "1.21.4", "loader": "forge"}):
            with self.subTest(variant=variant):
                with self.assertRaises(ValueError):
                    mod.read_settings({**self.profile, **variant})

    def test_no_invalid_values_can_be_written(self):
        with tempfile.TemporaryDirectory() as root, patch.object(mod, "game_path", return_value=pathlib.Path(root)):
            for malicious in ({"showHealth": 1, "showHunger": True, "showFoodCount": True},
                              {"showHealth": False, "showHunger": None, "showFoodCount": True},
                              {"showHealth": True, "showHunger": True}):
                with self.subTest(value=malicious), self.assertRaises(ValueError):
                    mod.save_settings(self.profile, malicious)
            self.assertFalse((pathlib.Path(root) / "config").exists())

    def test_bad_config_not_overwritten(self):
        with tempfile.TemporaryDirectory() as root, patch.object(mod, "game_path", return_value=pathlib.Path(root)):
            path = pathlib.Path(root) / "config" / "minevora_pvp.json"
            path.parent.mkdir()
            path.write_text("{broken", encoding="utf-8")
            with self.assertRaises(ValueError):
                mod.save_settings(self.profile, mod.DEFAULTS)
            self.assertEqual(path.read_text(encoding="utf-8"), "{broken")


if __name__ == "__main__":
    unittest.main()
