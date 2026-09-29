import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { follows, comments, ratings, favorites, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, inArray, sql } from "drizzle-orm";

export const runtime = "nodejs";

function toMs(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  const t = new Date(v).getTime();
  return isNaN(t) ? 0 : t;
}

// GET: Takip ettiklerimin son aktiviteleri
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();

    const following = await db.select().from(follows).where(eq(follows.followerId, session.userId));
    const ids = following.map((f) => f.followingId);
    if (ids.length === 0) return NextResponse.json({ feed: [], following: 0 });

    const [recentComments, recentRatings, recentFavs] = await Promise.all([
      db
        .select({
          id: comments.id,
          content: comments.content,
          context: comments.context,
          slug: comments.slug,
          chapter: comments.chapter,
          createdAt: comments.createdAt,
          userId: comments.userId,
          username: users.username,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(inArray(comments.userId, ids))
        .orderBy(sql`${comments.createdAt} DESC`)
        .limit(20),
      db
        .select()
        .from(ratings)
        .where(inArray(ratings.userId, ids))
        .orderBy(sql`${ratings.createdAt} DESC`)
        .limit(10),
      db
        .select()
        .from(favorites)
        .where(inArray(favorites.userId, ids))
        .orderBy(sql`${favorites.createdAt} DESC`)
        .limit(10),
    ]);

    const nameMap: Record<string, string> = {};
    const involved = [...new Set([...recentRatings.map((r) => r.userId), ...recentFavs.map((f) => f.userId)])];
    if (involved.length > 0) {
      const us = await db.select().from(users).where(inArray(users.id, involved));
      for (const u of us) nameMap[u.id] = u.username;
    }

    const feed: any[] = [
      ...recentComments.map((c) => ({ kind: "comment", ...c, ts: toMs(c.createdAt) })),
      ...recentRatings.map((r) => ({ kind: "rating", ...r, username: nameMap[r.userId] || "?", ts: toMs(r.createdAt) })),
      ...recentFavs.map((f) => ({ kind: "favorite", ...f, username: nameMap[f.userId] || "?", ts: toMs(f.createdAt) })),
    ];
    feed.sort((a, b) => b.ts - a.ts);

    return NextResponse.json({ feed: feed.slice(0, 30), following: ids.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
