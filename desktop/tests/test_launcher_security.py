"""Offline, deterministic checks: no Microsoft accounts or downloads required."""
import json
import pathlib
import sys
import tempfile
import types
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import core
import auth_diagnostics
import backend


class ProfileTests(unittest.TestCase):
    def test_safe_name_rejects_path_traversal(self):
        for value in ("../outside", "folder\\other", ".", "bad/thing", ""):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    core.safe_name(value)

    def test_profile_round_trip_validated(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = pathlib.Path(tmp) / "store.json"
            item = {"id": "0123456789abcdef", "name": "MINEVORA",
                    "version": "1.21.1", "loader": "fabric", "game_id": ""}
            state = {"instances": [item], "selected": item["id"], "ram": 4, "skin": "",
                     "web_profile": {"nickname": "Player_77", "mode": "BedWars",
                                     "avatarData": "data:image/webp;base64,AAAA"}}
            with mock.patch.object(core, "DATA_FILE", store):
                core.save_store(state)
                loaded = core.read_store()
            self.assertEqual(loaded["web_profile"]["nickname"], "Player_77")
            self.assertEqual(loaded["web_profile"]["mode"], "BedWars")

    def test_bad_imported_profile_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = pathlib.Path(tmp) / "store.json"
            state = core.initial_store()
            state["web_profile"] = {"nickname": "Bad Name", "avatarData": "javascript:alert(1)"}
            with mock.patch.object(core, "DATA_FILE", store):
                core.save_store(state)
                loaded = core.read_store()
            self.assertNotIn("web_profile", loaded)

    def test_oauth_report_only_safe_metadata(self):
        url = "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=aa&redirect_uri=http%3A%2F%2Flocalhost%3A8765%2Fcallback&state=TOPSECRET"
        result = auth_diagnostics.inspect_request(url, "aa", "http://localhost:8765/callback")
        self.assertTrue(result["client_id_matches"])
        self.assertTrue(result["redirect_matches"])
        self.assertNotIn("TOPSECRET", str(result))

    def test_version_list_contains_only_stable_releases(self):
        mocklib = types.SimpleNamespace(utils=types.SimpleNamespace(
            get_version_list=lambda: [{"id":"1.21.1","type":"release"},
                                      {"id":"24w35a","type":"snapshot"},
                                      {"id":"1.20.4","type":"release"}]))
        with mock.patch.dict(sys.modules, {"minecraft_launcher_lib": mocklib}):
            self.assertEqual(backend.official_releases(), ["1.21.1", "1.20.4"])


if __name__ == "__main__":
    unittest.main()
