import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  bio: text("bio"),
  role: text("role").default("member"),
  badge: text("badge"),
  accent: text("accent"),
  isPrivate: integer("is_private", { mode: "boolean" }).default(false),
  lastSeen: integer("last_seen", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
});

export const mangas = sqliteTable("mangas", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  coverImage: text("cover_image"),
  author: text("author"),
  status: text("status").default("ongoing"),
  type: text("type").default("manga"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const chapters = sqliteTable("chapters", {
  id: text("id").primaryKey(),
  mangaId: text("manga_id").notNull().references(() => mangas.id, { onDelete: "cascade" }),
  chapterNumber: real("chapter_number").notNull(),
  title: text("title"),
  viewCount: integer("view_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const readingHistory = sqliteTable("reading_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaSlug: text("manga_slug").notNull(),
  chapterNumber: real("chapter_number").notNull(),
  pageNumber: integer("page_number").default(1),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Yorumlar (manga, bölüm, genel sohbet)
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // context: "chapter", "manga", "chat", "feedback"
  context: text("context").notNull(),
  // slug: manga/bölüm için slug, chat için null
  slug: text("slug"),
  chapter: text("chapter"),
  parentId: text("parent_id"), // yanıt ise parent yorumun id'si
  content: text("content").notNull(),
  isSpoiler: integer("is_spoiler", { mode: "boolean" }).default(false),
  isEdited: integer("is_edited", { mode: "boolean" }).default(false),
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
});

// Yorumlara beğeni
export const commentLikes = sqliteTable("comment_likes", {
  id: text("id").primaryKey(),
  commentId: text("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Anketler
export const polls = sqliteTable("polls", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON array
  endsAt: integer("ends_at"), // null = sonsuz
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Anket oyları
export const pollVotes = sqliteTable("poll_votes", {
  id: text("id").primaryKey(),
  pollId: text("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  optionIndex: integer("option_index").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Destek talepleri
export const supportTickets = sqliteTable("support_tickets", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("open"), // open, in_progress, closed
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Şikayetler / Bildirimler
export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id").references(() => users.id, { onDelete: "set null" }),
  targetType: text("target_type").notNull(), // "user", "comment"
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  detail: text("detail"),
  status: text("status").default("pending"), // pending, reviewed, dismissed
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Favoriler / Kütüphane
export const favorites = sqliteTable("favorites", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaSlug: text("manga_slug").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Manga puanları (1-10)
export const ratings = sqliteTable("ratings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaSlug: text("manga_slug").notNull(),
  score: integer("score").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Takip sistemi
export const follows = sqliteTable("follows", {
  id: text("id").primaryKey(),
  followerId: text("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: text("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Bildirimler
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "reply", "follow", "announcement"
  title: text("title").notNull(),
  message: text("message"),
  link: text("link"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Admin duyuruları
export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isPinned: integer("is_pinned", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Yorum tepkileri (emoji)
export const commentReactions = sqliteTable("comment_reactions", {
  id: text("id").primaryKey(),
  commentId: text("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Seri takibi (yeni bölüm bildirimleri için)
export const seriesFollows = sqliteTable("series_follows", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaSlug: text("manga_slug").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Uzaklaştırmalar (ban)
export const bans = sqliteTable("bans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  expiresAt: integer("expires_at"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Rozet mağazası
export const badges = sqliteTable("badges", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  costXp: integer("cost_xp").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const userBadges = sqliteTable("user_badges", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Ziyaretçi defteri (profil duvarı)
export const wallPosts = sqliteTable("wall_posts", {
  id: text("id").primaryKey(),
  profileUserId: text("profile_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Başarımlar
export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const userAchievements = sqliteTable("user_achievements", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Bildirim tercihleri
export const notificationPrefs = sqliteTable("notification_prefs", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  reply: integer("reply", { mode: "boolean" }).default(true),
  follow: integer("follow", { mode: "boolean" }).default(true),
  mention: integer("mention", { mode: "boolean" }).default(true),
  announcement: integer("announcement", { mode: "boolean" }).default(true),
  achievement: integer("achievement", { mode: "boolean" }).default(true),
  streak: integer("streak", { mode: "boolean" }).default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Öne çıkan manga (anasayfa vitrini)
export const featured = sqliteTable("featured", {
  id: text("id").primaryKey(),
  mangaSlug: text("manga_slug").notNull(),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Bölüm beğenileri
export const chapterLikes = sqliteTable("chapter_likes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaSlug: text("manga_slug").notNull(),
  chapter: text("chapter").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Bölüm görüntülenme sayaçları
export const chapterStats = sqliteTable("chapter_stats", {
  mangaSlug: text("manga_slug").notNull(),
  chapter: text("chapter").notNull(),
  views: integer("views").default(0),
});

// Kullanıcı engelleme
export const blocks = sqliteTable("blocks", {
  id: text("id").primaryKey(),
  blockerId: text("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedId: text("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Site ayarları (bakım modu, discord webhook...)
export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Manga listesi (Okuyorum / Tamamladım / Bekletiyorum / Bıraktım / Planlıyorum)
export const mangaList = sqliteTable("manga_list", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mangaSlug: text("manga_slug").notNull(),
  status: text("status").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Özel mesajlaşma
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  userA: text("user_a").notNull().references(() => users.id, { onDelete: "cascade" }),
  userB: text("user_b").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Seri ekleme talepleri
export const seriesRequests = sqliteTable("series_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  author: text("author"),
  description: text("description"),
  link: text("link"),
  status: text("status").default("pending"), // pending, approved, rejected
  adminNote: text("admin_note"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Okuma hedefleri (kind: daily_pages, weekly_chapters, daily_messages)
export const readingGoals = sqliteTable("reading_goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  target: integer("target").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

// Günlük aktivite (streak + hedef hesabı)
export const dailyActivity = sqliteTable("daily_activity", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  day: text("day").notNull(), // YYYY-MM-DD
  pages: integer("pages").default(0),
  chapters: integer("chapters").default(0),
  messages: integer("messages").default(0),
});

