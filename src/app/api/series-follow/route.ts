import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seriesFollows } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: Takip edilen serilerim (?slug= ile tek kontrol)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ follows: [], isFollowing: false });
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const existing = await db
        .select()
        .from(seriesFollows)
        .where(and(eq(seriesFollows.userId, session.userId), eq(seriesFollows.mangaSlug, slug)));
      return NextResponse.json({ isFollowing: existing.length > 0 });
    }

    const rows = await db
      .select()
      .from(seriesFollows)
      .where(eq(seriesFollows.userId, session.userId))
      .orderBy(sql`${seriesFollows.createdAt} DESC`)
      .limit(100);
    return NextResponse.json({ follows: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Seri takip et/bırak (toggle) {mangaSlug}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { mangaSlug } = (await req.json()) as any;
    if (!mangaSlug) return NextResponse.json({ error: "mangaSlug gerekli." }, { status: 400 });

    const existing = await db
      .select()
      .from(seriesFollows)
      .where(and(eq(seriesFollows.userId, session.userId), eq(seriesFollows.mangaSlug, mangaSlug)));

    if (existing.length > 0) {
      await db.delete(seriesFollows).where(eq(seriesFollows.id, existing[0].id));
      return NextResponse.json({ isFollowing: false });
    }
    await db.insert(seriesFollows).values({ id: randomUUID(), userId: session.userId, mangaSlug });
    return NextResponse.json({ isFollowing: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
