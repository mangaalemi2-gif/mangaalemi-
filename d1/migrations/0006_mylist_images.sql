-- Manga listesi (izleme durumları), yorum resimleri

CREATE TABLE IF NOT EXISTS manga_list (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, manga_slug)
);

ALTER TABLE comments ADD COLUMN image_url TEXT;
