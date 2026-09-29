import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  users,
  comments,
  commentLikes,
  polls,
  pollVotes,
  ratings,
  follows,
  readingHistory,
  achievements,
  userAchievements,
  notifications,
  dailyActivity,
} from "./db/schema";
import { getStreak, todayStr } from "./streaks";

export interface Award {
  key: string;
  name: string;
  icon: string;
  description: string;
}

// Başarım kontrolü: eksikleri verir + bildirim oluşturur. Yeni kazanılanları döndürür.
export async function checkAchievements(db: any, userId: string): Promise<Award[]> {
  const all = await db.select().from(achievements);
  if (all.length === 0) return [];
  const owned = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  const ownedIds = new Set(owned.map((o: any) => o.achievementId));
  const byId: Record<string, any> = {};
  for (const a of all) byId[a.id] = a;

  const num = async (table: any, col: any) => {
    const [r] = (await db.select({ n: sql<number>`COUNT(*)` }).from(table).where(eq(col, userId))) as any;
    return Number(r?.n ?? 0);
  };

  const commentCount = await num(comments, comments.userId);
  const [lr] = (await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(commentLikes)
    .innerJoin(comments, eq(commentLikes.commentId, comments.id))
    .where(eq(comments.userId, userId))) as any;
  const likesReceived = Number((lr as any)?.n ?? 0);
  const history = await db.select().from(readingHistory).where(eq(readingHistory.userId, userId));
  const chaptersRead = history.length;
  const voteCount = await num(pollVotes, pollVotes.userId);
  const rateCount = await num(ratings, ratings.userId);
  const [fl] = (await db.select({ n: sql<number>`COUNT(*)` }).from(follows).where(eq(follows.followingId, userId))) as any;
  const followers = Number((fl as any)?.n ?? 0);
  const reading = await getStreak(db, userId, "chapters");

  // Sayfa hesabı (manifest üzerinden yaklaşık)
  let pages = 0;
  try {
    const manifest = (await import("@/data/manga-manifest.json")).default as Record<string, string[]>;
    for (const h of history as any[]) {
      for (let i = 1; i < h.chapterNumber; i++) pages += manifest[`${h.mangaSlug}/Chapter${i}`]?.length || 0;
      pages += Math.min(h.pageNumber, manifest[`${h.mangaSlug}/Chapter${h.chapterNumber}`]?.length || h.pageNumber);
    }
  } catch { /* yoksay */ }

  const earned: Record<string, boolean> = {
    "first-comment": commentCount >= 1,
    "chatter-10": commentCount >= 10,
    "chatter-100": commentCount >= 100,
    "liked-10": likesReceived >= 10,
    "reader-10": chaptersRead >= 10,
    "pages-1000": pages >= 1000,
    "streak-7": reading.longest >= 7,
    pollster: voteCount >= 5,
    social: followers >= 5,
    rater: rateCount >= 5,
  };

  const fresh: Award[] = [];
  for (const a of all) {
    if (ownedIds.has(a.id) || !earned[a.key]) continue;
    await db.insert(userAchievements).values({ userId, achievementId: a.id });
    fresh.push({ key: a.key, name: a.name, icon: a.icon, description: a.description });
    const { notify } = await import("./notifications");
    await notify(db, {
      userId,
      type: "achievement",
      title: `Yeni başarım: ${a.icon} ${a.name}`,
      message: a.description,
      link: "/profile",
    });
  }
  return fresh;
}
