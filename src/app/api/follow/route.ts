import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { follows, notifications } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: ?userId= → takipçi/takip sayıları + ben takip ediyor muyum
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId gerekli." }, { status: 400 });
    const session = await getSession(req);

    const [followers] = await db.select({ n: sql<number>`COUNT(*)` }).from(follows).where(eq(follows.followingId, userId)) as any;
    const [following] = await db.select({ n: sql<number>`COUNT(*)` }).from(follows).where(eq(follows.followerId, userId)) as any;

    let isFollowing = false;
    if (session && session.userId !== userId) {
      const existing = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, session.userId), eq(follows.followingId, userId)));
      isFollowing = existing.length > 0;
    }

    return NextResponse.json({
      followers: Number((followers as any)?.n ?? 0),
      following: Number((following as any)?.n ?? 0),
      isFollowing,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Takip et/bırak (toggle) {targetUserId}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { targetUserId } = (await req.json()) as any;
    if (!targetUserId) return NextResponse.json({ error: "targetUserId gerekli." }, { status: 400 });
    if (targetUserId === session.userId) return NextResponse.json({ error: "Kendini takip edemezsin." }, { status: 400 });

    const existing = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, session.userId), eq(follows.followingId, targetUserId)));

    if (existing.length > 0) {
      await db.delete(follows).where(eq(follows.id, existing[0].id));
      return NextResponse.json({ following: false });
    }

    await db.insert(follows).values({ id: randomUUID(), followerId: session.userId, followingId: targetUserId });

    // Bildirim gönder
    const { users } = await import("@/lib/db/schema");
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    await db.insert(notifications).values({
      id: randomUUID(),
      userId: targetUserId,
      type: "follow",
      title: "Yeni takipçi",
      message: `@${(me as any)?.username ?? "Biri"} seni takip etmeye başladı.`,
      link: me ? `/kullanici/${encodeURIComponent((me as any).username)}` : null,
    });

    return NextResponse.json({ following: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
