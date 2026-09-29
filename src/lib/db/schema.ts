import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  role: text("role").default("member"),
  badge: text("badge"),
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

