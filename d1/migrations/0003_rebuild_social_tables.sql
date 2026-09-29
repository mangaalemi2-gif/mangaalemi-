-- Eski tabloları yeni yapıya taşı (kodun beklediği şema).
-- Eski veriler *_legacy tablolarında yedekte kalır.

-- comments: eski yapıda (chapter_id, manga_id) vardı; yeni yapıda (context, slug, chapter, parent_id, is_deleted...) gerekli
ALTER TABLE comments RENAME TO comments_legacy;

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  context TEXT NOT NULL,
  slug TEXT,
  chapter TEXT,
  parent_id TEXT,
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  is_deleted INTEGER DEFAULT 0,
  is_spoiler INTEGER DEFAULT 0
);

-- favorites: eski yapıda manga_id vardı; yeni yapıda manga_slug + id gerekli
ALTER TABLE favorites RENAME TO favorites_legacy;

CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_slug TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, manga_slug)
);

-- ratings: eski yapıda manga_id vardı; yeni yapıda manga_slug + id gerekli
ALTER TABLE ratings RENAME TO ratings_legacy;

CREATE TABLE ratings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manga_slug TEXT NOT NULL,
  score INTEGER NOT NULL CHECK(score >= 1 AND score <= 10),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(user_id, manga_slug)
);
