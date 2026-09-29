import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { favorites } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: Favorilerim (?slug= ile tek kontrol)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ favorites: [], isFavorite: false });
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const existing = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, session.userId), eq(favorites.mangaSlug, slug)));
      return NextResponse.json({ isFavorite: existing.length > 0 });
    }

    const rows = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, session.userId))
      .orderBy(sql`${favorites.createdAt} DESC`)
      .limit(100);
    return NextResponse.json({ favorites: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Favori ekle/çıkar (toggle)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { mangaSlug } = (await req.json()) as any;
    if (!mangaSlug) return NextResponse.json({ error: "mangaSlug gerekli." }, { status: 400 });

    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, session.userId), eq(favorites.mangaSlug, mangaSlug)));

    if (existing.length > 0) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id));
      return NextResponse.json({ isFavorite: false });
    }
    await db.insert(favorites).values({ id: randomUUID(), userId: session.userId, mangaSlug });
    return NextResponse.json({ isFavorite: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
