-- Son görülme, profil kapağı, rozet mağazası

ALTER TABLE users ADD COLUMN last_seen INTEGER;
ALTER TABLE users ADD COLUMN cover_url TEXT;

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  cost_xp INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, badge_id)
);

INSERT OR IGNORE INTO badges (id, name, icon, cost_xp) VALUES
  ('badge-star', 'Yıldız', '🌟', 100),
  ('badge-flame', 'Alev', '🔥', 250),
  ('badge-diamond', 'Elmas', '💎', 500),
  ('badge-crown', 'Kral', '👑', 1000),
  ('badge-dragon', 'Ejder', '🐉', 2000);
