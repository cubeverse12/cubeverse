-- Private profile sync; owner key is verified Microsoft OIDC sub, not public nickname.
-- No passwords, emails, Microsoft tokens, IP addresses or logs stored here.
CREATE TABLE IF NOT EXISTS profiles (
  user_sub TEXT PRIMARY KEY NOT NULL,
  nickname TEXT NOT NULL,
  mode TEXT NOT NULL,
  color TEXT NOT NULL,
  avatar_data TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
