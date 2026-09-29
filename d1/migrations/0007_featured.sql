-- Öne çıkan manga (anasayfa vitrini, tek satır)

CREATE TABLE IF NOT EXISTS featured (
  id TEXT PRIMARY KEY,
  manga_slug TEXT NOT NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
