-- Kullanıcılar (Users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'member', -- admin, editor, member
    badge TEXT DEFAULT NULL, -- Destekçi / Sponsor
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mangalar (Mangas)
CREATE TABLE IF NOT EXISTS mangas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image TEXT,
    author TEXT,
    status TEXT DEFAULT 'ongoing', -- ongoing, completed
    type TEXT DEFAULT 'manga', -- manga, webtoon
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Manga Türleri/Etiketleri (Genres)
CREATE TABLE IF NOT EXISTS genres (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

-- Manga - Tür İlişkisi (Manga_Genres)
CREATE TABLE IF NOT EXISTS manga_genres (
    manga_id TEXT NOT NULL,
    genre_id TEXT NOT NULL,
    PRIMARY KEY (manga_id, genre_id),
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Bölümler (Chapters)
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    manga_id TEXT NOT NULL,
    chapter_number REAL NOT NULL,
    title TEXT,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
);

-- Yorumlar (Comments)
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    chapter_id TEXT, -- Sadece bir bölüme yorum yapılabilir
    manga_id TEXT, -- veya genel mangaya
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
);

-- Bookmark / Kaldığın Yer (Bookmarks)
CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    manga_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    page_number INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    UNIQUE(user_id, manga_id) -- Bir kullanıcının bir manga için tek bir güncel yer işareti olur
);

-- Favoriler (Favorites)
CREATE TABLE IF NOT EXISTS favorites (
    user_id TEXT NOT NULL,
    manga_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manga_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
);

-- Beğeniler (Likes)
CREATE TABLE IF NOT EXISTS likes (
    user_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, chapter_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Puanlamalar (Ratings)
CREATE TABLE IF NOT EXISTS ratings (
    user_id TEXT NOT NULL,
    manga_id TEXT NOT NULL,
    score INTEGER CHECK(score >= 1 AND score <= 10),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manga_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
);
