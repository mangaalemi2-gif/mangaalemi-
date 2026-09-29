-- Yorum tepkileri, seri takibi, banlar, sabitli duyuru, düzenlendi işareti

CREATE TABLE IF NOT EXISTS comment_reactions (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(comment_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS series_follows (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_slug TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, manga_slug)
);

CREATE TABLE IF NOT EXISTS bans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  expires_at INTEGER,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

ALTER TABLE comments ADD COLUMN is_edited INTEGER DEFAULT 0;
ALTER TABLE announcements ADD COLUMN is_pinned INTEGER DEFAULT 0;
