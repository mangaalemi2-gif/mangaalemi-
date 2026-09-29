-- Özel manga notları

CREATE TABLE IF NOT EXISTS manga_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_slug TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, manga_slug)
);
