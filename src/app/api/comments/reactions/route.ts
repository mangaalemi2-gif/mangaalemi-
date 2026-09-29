import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { commentReactions } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const ALLOWED_EMOJIS = ["🔥", "😂", "😮", "❤️", "😢", "👏"];

// GET: ?ids=a,b,c → her yorum için emoji sayıları + benim tepkilerim
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const ids = (searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 60);
    if (ids.length === 0) return NextResponse.json({ counts: {}, mine: {} });
    const session = await getSession(req);

    const rows = await db.select().from(commentReactions).where(inArray(commentReactions.commentId, ids));

    const counts: Record<string, Record<string, number>> = {};
    const mine: Record<string, string[]> = {};
    for (const r of rows) {
      counts[r.commentId] = counts[r.commentId] || {};
      counts[r.commentId][r.emoji] = (counts[r.commentId][r.emoji] || 0) + 1;
      if (session && r.userId === session.userId) {
        mine[r.commentId] = mine[r.commentId] || [];
        mine[r.commentId].push(r.emoji);
      }
    }
    return NextResponse.json({ counts, mine });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Tepki ekle/çıkar (toggle) {commentId, emoji}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { commentId, emoji } = (await req.json()) as any;
    if (!commentId || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Geçersiz tepki." }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(commentReactions)
      .where(
        and(
          eq(commentReactions.commentId, commentId),
          eq(commentReactions.userId, session.userId),
          eq(commentReactions.emoji, emoji)
        )
      );

    if (existing.length > 0) {
      await db.delete(commentReactions).where(eq(commentReactions.id, existing[0].id));
      return NextResponse.json({ reacted: false });
    }
    await db.insert(commentReactions).values({ id: randomUUID(), commentId, userId: session.userId, emoji });
    return NextResponse.json({ reacted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
