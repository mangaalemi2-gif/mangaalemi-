import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { commentLikes } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// POST: Beğen / Beğeniyi kaldır (toggle)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

    const db = getDb();
    const { commentId } = await req.json() as { commentId: string };
    if (!commentId) return NextResponse.json({ error: "commentId gerekli." }, { status: 400 });

    const existing = await db
      .select()
      .from(commentLikes)
      .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, session.userId)));

    if (existing.length > 0) {
      await db.delete(commentLikes).where(eq(commentLikes.id, existing[0].id));
      return NextResponse.json({ liked: false });
    } else {
      await db.insert(commentLikes).values({
        id: randomUUID(),
        commentId,
        userId: session.userId,
      });
      return NextResponse.json({ liked: true });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: Kullanıcının beğendiği yorum ID'leri
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ liked: [] });

    const db = getDb();
    const rows = await db
      .select({ commentId: commentLikes.commentId })
      .from(commentLikes)
      .where(eq(commentLikes.userId, session.userId));

    return NextResponse.json({ liked: rows.map((r) => r.commentId) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
