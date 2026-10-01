-- Referans sistemi

ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN referred_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN bonus_xp INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS referral_log (
  id TEXT PRIMARY KEY,
  earner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
