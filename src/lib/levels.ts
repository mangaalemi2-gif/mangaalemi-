import { eq, sql } from "drizzle-orm";
import { users, comments, commentLikes, polls, pollVotes, favorites, follows } from "./db/schema";

// XP kuralları
export const XP = {
  comment: 5,
  likeReceived: 2,
  pollCreated: 3,
  vote: 1,
  favorite: 1,
  follower: 3,
};

const LEVELS: { level: number; xp: number; title: string }[] = [
  { level: 1, xp: 0, title: "Çaylak" },
  { level: 2, xp: 50, title: "Okuyucu" },
  { level: 3, xp: 150, title: "Müptela" },
  { level: 4, xp: 300, title: "Kıdemli" },
  { level: 5, xp: 500, title: "Uzman" },
  { level: 6, xp: 800, title: "Veteran" },
  { level: 7, xp: 1200, title: "Üstat" },
  { level: 8, xp: 1700, title: "Efsane" },
  { level: 9, xp: 2300, title: "Mitolojik" },
  { level: 10, xp: 3000, title: "Tanrı Seviyesi" },
];

export function levelForXp(xp: number) {
  let current = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) current = LEVELS[i];
    else {
      next = LEVELS[i];
      break;
    }
  }
  const progress = next ? (xp - current.xp) / (next.xp - current.xp) : 1;
  return { ...current, nextXp: next?.xp ?? null, nextLevel: next?.level ?? null, progress: Math.min(Math.max(progress, 0), 1) };
}

export async function getUserXp(db: any, userId: string): Promise<number> {
  const [[c], [lr], [p], [v], [f], [fl], [me]] = await Promise.all([
    db.select({ n: sql<number>`COUNT(*)` }).from(comments).where(eq(comments.userId, userId)),
    db.select({ n: sql<number>`COUNT(*)` }).from(commentLikes).innerJoin(comments, eq(commentLikes.commentId, comments.id)).where(eq(comments.userId, userId)),
    db.select({ n: sql<number>`COUNT(*)` }).from(polls).where(eq(polls.userId, userId)),
    db.select({ n: sql<number>`COUNT(*)` }).from(pollVotes).where(eq(pollVotes.userId, userId)),
    db.select({ n: sql<number>`COUNT(*)` }).from(favorites).where(eq(favorites.userId, userId)),
    db.select({ n: sql<number>`COUNT(*)` }).from(follows).where(eq(follows.followingId, userId)),
    db.select({ bonusXp: users.bonusXp }).from(users).where(eq(users.id, userId)),
  ]);
  const num = (r: any) => Number(r?.[0]?.n ?? 0);
  return (
    num(c) * XP.comment +
    num(lr) * XP.likeReceived +
    num(p) * XP.pollCreated +
    num(v) * XP.vote +
    num(f) * XP.favorite +
    num(fl) * XP.follower +
    Number((me as any)?.[0]?.bonusXp ?? 0)
  );
}

export async function getLeaderboard(db: any, limit = 20) {
  const allUsers = await db
    .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl, badge: users.badge, role: users.role })
    .from(users)
    .limit(200);
  const withXp = await Promise.all(
    allUsers.map(async (u: any) => {
      const xp = await getUserXp(db, u.id);
      const lv = levelForXp(xp);
      return { ...u, xp, level: lv.level, title: lv.title, progress: lv.progress };
    })
  );
  return withXp.sort((a, b) => b.xp - a.xp).slice(0, limit);
}
