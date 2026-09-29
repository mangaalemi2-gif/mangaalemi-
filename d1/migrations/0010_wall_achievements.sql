-- Ziyaretçi defteri, başarımlar, vurgu rengi

CREATE TABLE IF NOT EXISTS wall_posts (
  id TEXT PRIMARY KEY,
  profile_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, achievement_id)
);

INSERT OR IGNORE INTO achievements (id, key, name, icon, description) VALUES
  ('ach-first-comment', 'first-comment', 'İlk Adım', '💬', 'İlk yorumunu yazdın'),
  ('ach-chatter-10', 'chatter-10', 'Muhabbetçi', '🗣️', '10 yorum yazdın'),
  ('ach-chatter-100', 'chatter-100', 'Geveze', '📢', '100 yorum yazdın'),
  ('ach-liked-10', 'liked-10', 'Sevilen', '❤️', 'Yorumların 10 beğeni aldı'),
  ('ach-reader-10', 'reader-10', 'Kitap Kurdu', '📚', '10 bölüm okudun'),
  ('ach-pages-1000', 'pages-1000', 'Sayfa Avcısı', '📖', '1000 sayfa okudun'),
  ('ach-streak-7', 'streak-7', 'Azimli', '🔥', '7 gün üst üste okudun'),
  ('ach-pollster', 'pollster', 'Anketçi', '📊', '5 ankete oy verdin'),
  ('ach-social', 'social', 'Popüler', '⭐', '5 takipçi kazandın'),
  ('ach-rater', 'rater', 'Eleştirmen', '🎬', '5 seriye puan verdin');

ALTER TABLE users ADD COLUMN accent TEXT;
