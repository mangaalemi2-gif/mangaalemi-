import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chapterLikes, chapterStats } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: ?slug=&chapter= tek bölüm | ?slug= tüm bölümler
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const chapter = searchParams.get("chapter");
    if (!slug) return NextResponse.json({ error: "slug gerekli." }, { status: 400 });
    const session = await getSession(req);

    if (chapter) {
      const [stat] = await db
        .select()
        .from(chapterStats)
        .where(and(eq(chapterStats.mangaSlug, slug), eq(chapterStats.chapter, chapter)));
      const likes = await db
        .select({ n: sql<number>`COUNT(*)` })
        .from(chapterLikes)
        .where(and(eq(chapterLikes.mangaSlug, slug), eq(chapterLikes.chapter, chapter)));
      let liked = false;
      if (session) {
        const mine = await db
          .select()
          .from(chapterLikes)
          .where(
            and(
              eq(chapterLikes.userId, session.userId),
              eq(chapterLikes.mangaSlug, slug),
              eq(chapterLikes.chapter, chapter)
            )
          );
        liked = mine.length > 0;
      }
      return NextResponse.json({
        views: (stat as any)?.views ?? 0,
        likes: Number((likes[0] as any)?.n ?? 0),
        liked,
      });
    }

    const stats = await db.select().from(chapterStats).where(eq(chapterStats.mangaSlug, slug));
    const likes = await db.select().from(chapterLikes).where(eq(chapterLikes.mangaSlug, slug));
    const byChapter: Record<string, { views: number; likes: number }> = {};
    for (const s of stats) byChapter[s.chapter] = { views: s.views || 0, likes: 0 };
    for (const l of likes) {
      byChapter[l.chapter] = byChapter[l.chapter] || { views: 0, likes: 0 };
      byChapter[l.chapter].likes++;
    }
    return NextResponse.json({ byChapter });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: {slug, chapter, action: "like" | "view"}
export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { slug, chapter, action } = (await req.json()) as any;
    if (!slug || !chapter || !["like", "view"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    if (action === "view") {
      // Atomik sayaç artır (misafirler de sayılır)
      const [existing] = await db
        .select()
        .from(chapterStats)
        .where(and(eq(chapterStats.mangaSlug, slug), eq(chapterStats.chapter, chapter)));
      if (existing) {
        await db
          .update(chapterStats)
          .set({ views: sql`${chapterStats.views} + 1` })
          .where(and(eq(chapterStats.mangaSlug, slug), eq(chapterStats.chapter, chapter)));
      } else {
        await db.insert(chapterStats).values({ mangaSlug: slug, chapter, views: 1 });
      }
      return NextResponse.json({ ok: true });
    }

    // like → giriş gerekli
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const existing = await db
      .select()
      .from(chapterLikes)
      .where(
        and(
          eq(chapterLikes.userId, session.userId),
          eq(chapterLikes.mangaSlug, slug),
          eq(chapterLikes.chapter, chapter)
        )
      );
    if (existing.length > 0) {
      await db.delete(chapterLikes).where(eq(chapterLikes.id, existing[0].id));
      return NextResponse.json({ liked: false });
    }
    await db.insert(chapterLikes).values({ id: randomUUID(), userId: session.userId, mangaSlug: slug, chapter });
    return NextResponse.json({ liked: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
