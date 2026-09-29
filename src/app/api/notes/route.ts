import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { mangaNotes } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: ?slug= → notum
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ note: null });
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "slug gerekli." }, { status: 400 });
    const [row] = await db
      .select()
      .from(mangaNotes)
      .where(and(eq(mangaNotes.userId, session.userId), eq(mangaNotes.mangaSlug, slug)));
    return NextResponse.json({ note: row?.content ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: {mangaSlug, content} — boş içerik notu siler
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { mangaSlug, content } = (await req.json()) as any;
    if (!mangaSlug) return NextResponse.json({ error: "mangaSlug gerekli." }, { status: 400 });
    if (content?.length > 2000) return NextResponse.json({ error: "En fazla 2000 karakter." }, { status: 400 });

    await db
      .delete(mangaNotes)
      .where(and(eq(mangaNotes.userId, session.userId), eq(mangaNotes.mangaSlug, mangaSlug)));
    if (content?.trim()) {
      await db.insert(mangaNotes).values({
        id: randomUUID(),
        userId: session.userId,
        mangaSlug,
        content: content.trim(),
        updatedAt: new Date(),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
