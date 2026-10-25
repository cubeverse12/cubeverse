"""Pure offline tests for desktop's private Cloudflare profile synchronization."""
import io
import json
import pathlib
import sys
import unittest
from unittest.mock import Mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import cloud_profile as sync


class CloudProfileTests(unittest.TestCase):
    sample = {"nickname": "Minevora_77", "mode": "BedWars", "color": "purple", "avatarData": ""}

    def test_sanitized_accepted_profile(self):
        value = {**self.sample, "refresh_token": "DONT_SAVE_ME", "email": "private@example.com"}
        self.assertEqual(sync.validate_profile(value), self.sample)

    def test_bad_nick_and_image_rejected(self):
        invalid = [
            {**self.sample, "nickname": "../admin"},
            {**self.sample, "nickname": "Bad Name"},
            {**self.sample, "mode": "Admin"},
            {**self.sample, "color": "javascript:alert(1)"},
            {**self.sample, "avatarData": "https://images.example/avatar.png"},
            {**self.sample, "avatarData": "data:image/svg+xml;base64,PHN2Zz4="},
            {**self.sample, "avatarData": "x" * 400001}
        ]
        for item in invalid:
            with self.subTest(item=item.get("nickname", item.get("avatarData", "")[:24])):
                with self.assertRaises(ValueError):
                    sync.validate_profile(item)

    def test_separate_oauth_scope_no_game_token(self):
        app = Mock()
        app.get_accounts.return_value = []
        app.acquire_token_interactive.return_value = {"access_token": "ephemeral-secret"}
        factory = Mock(return_value=app)
        session = sync.MicrosoftProfileSession(client_factory=factory)
        self.assertEqual(session.access_token(), "ephemeral-secret")
        factory.assert_called_once_with(sync.API_CLIENT_ID, authority=sync.AUTHORITY)
        kwargs = app.acquire_token_interactive.call_args.kwargs
        self.assertEqual(kwargs["scopes"], [sync.API_SCOPE])
        self.assertEqual(kwargs["prompt"], "select_account")
        self.assertEqual(kwargs["timeout"], 180)
        session.disconnect()
        self.assertIsNone(session._app)

    def test_fetch_only_returns_expected_profile_fields(self):
        reply = {"profile": {**self.sample, "email": "private@example.com", "access_token": "DO_NOT_STORE"}}
        response = io.BytesIO(json.dumps(reply).encode())
        response.geturl = lambda: sync.API_ENDPOINT
        opener = Mock()
        opener.open.return_value = response
        result = sync.call_profile_api("test-only", opener=opener)
        self.assertEqual(result, self.sample)
        request = opener.open.call_args.args[0]
        self.assertEqual(request.full_url, sync.API_ENDPOINT)
        self.assertEqual(request.get_header("Authorization"), "Bearer test-only")

    def test_empty_profile_does_not_overwrite_local_profile(self):
        response = io.BytesIO(b'{"profile": null}')
        response.geturl = lambda: sync.API_ENDPOINT
        opener = Mock()
        opener.open.return_value = response
        self.assertIsNone(sync.call_profile_api("test-only", opener=opener))

    def test_upload_and_confirm_without_leaking_tokens_into_payload(self):
        response = io.BytesIO(b'{"saved":true}')
        response.geturl = lambda: sync.API_ENDPOINT
        opener = Mock()
        opener.open.return_value = response
        self.assertTrue(sync.call_profile_api("ephemeral-secret", method="PUT",
                                              value={**self.sample, "access_token":"secret"},
                                              opener=opener))
        request = opener.open.call_args.args[0]
        self.assertNotIn(b"secret", request.data)
        self.assertEqual(json.loads(request.data), self.sample)

    def test_reject_http_redirects_for_authorization(self):
        import urllib.request
        handler = sync.RejectRedirect()
        request = urllib.request.Request(sync.API_ENDPOINT,
                                         headers={"Authorization":"Bearer secret"})
        self.assertIsNone(handler.redirect_request(
            request, None, 302, "Found", {}, "https://evil.example/"))

    def test_never_display_auth_token_on_http_error(self):
        import urllib.error
        opener = Mock()
        opener.open.side_effect = urllib.error.HTTPError(
            sync.API_ENDPOINT, 401, "Invalid token: topsecret", {}, None)
        with self.assertRaisesRegex(RuntimeError, "Microsoft nie autoryzował"):
            sync.call_profile_api("topsecret", opener=opener)


if __name__ == "__main__":
    unittest.main()
