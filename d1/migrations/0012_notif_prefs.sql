-- Bildirim tercihleri

CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  reply INTEGER DEFAULT 1,
  follow INTEGER DEFAULT 1,
  mention INTEGER DEFAULT 1,
  announcement INTEGER DEFAULT 1,
  achievement INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 1,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
