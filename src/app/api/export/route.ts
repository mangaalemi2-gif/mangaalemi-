import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  users,
  favorites,
  mangaList,
  seriesFollows,
  ratings,
  readingHistory,
  readingGoals,
  follows,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Verilerimi JSON indir (KVKK/GDPR)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const uid = session.userId;

    const [user] = await db
      .select({
        username: users.username,
        email: users.email,
        bio: users.bio,
        badge: users.badge,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, uid));

    const [favs, list, sfollows, rates, hist, goals, following, followers] = await Promise.all([
      db.select().from(favorites).where(eq(favorites.userId, uid)),
      db.select().from(mangaList).where(eq(mangaList.userId, uid)),
      db.select().from(seriesFollows).where(eq(seriesFollows.userId, uid)),
      db.select().from(ratings).where(eq(ratings.userId, uid)),
      db.select().from(readingHistory).where(eq(readingHistory.userId, uid)),
      db.select().from(readingGoals).where(eq(readingGoals.userId, uid)),
      db.select().from(follows).where(eq(follows.followerId, uid)),
      db.select().from(follows).where(eq(follows.followingId, uid)),
    ]);

    return NextResponse.json(
      {
        exportedAt: new Date().toISOString(),
        profile: user,
        favorites: favs,
        mangaList: list,
        seriesFollows: sfollows,
        ratings: rates,
        readingHistory: hist,
        goals,
        following: following.map((f) => f.followingId),
        followers: followers.map((f) => f.followerId),
      },
      {
        headers: {
          "Content-Disposition": 'attachment; filename="mangaalemi-verilerim.json"',
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
