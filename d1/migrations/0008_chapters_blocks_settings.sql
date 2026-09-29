-- Bölüm beğenileri, görüntülenme sayaçları, engelleme, site ayarları

CREATE TABLE IF NOT EXISTS chapter_likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_slug TEXT NOT NULL,
  chapter TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, manga_slug, chapter)
);

CREATE TABLE IF NOT EXISTS chapter_stats (
  manga_slug TEXT NOT NULL,
  chapter TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  PRIMARY KEY (manga_slug, chapter)
);

CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
