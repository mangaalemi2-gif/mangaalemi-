import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { achievements, userAchievements } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { checkAchievements } from "@/lib/achievements";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Başarımlar (?user=username herkese açık, yoksa kendim + kontrol)
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const forUser = searchParams.get("user");
    const session = await getSession(req);

    const all = await db.select().from(achievements).orderBy(sql`${achievements.createdAt} ASC`);

    let targetId: string | null = null;
    if (forUser) {
      const [u] = await db.select().from(users).where(eq(users.username, forUser));
      if (!u) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
      targetId = u.id;
    } else if (session) {
      targetId = session.userId;
      try {
        await checkAchievements(db, session.userId);
      } catch { /* yoksay */ }
    } else {
      return NextResponse.json({ achievements: all, owned: [] });
    }

    const owned = await db.select().from(userAchievements).where(eq(userAchievements.userId, targetId!));
    const ownedMap: Record<string, any> = {};
    for (const o of owned) ownedMap[o.achievementId] = o.createdAt;

    return NextResponse.json({
      achievements: all.map((a) => ({ ...a, earnedAt: ownedMap[a.id] ?? null })),
      total: all.length,
      earned: owned.length,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
