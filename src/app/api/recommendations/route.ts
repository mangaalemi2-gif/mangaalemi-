import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { favorites, ratings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { getManga } from "@/data/mangas";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET: ?slug= → "bunu sevenler şunları da sevdi" (ortak favori + yüksek puan)
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "slug gerekli." }, { status: 400 });

    // Bu seriyi seven kullanıcılar (favori veya 7+ puan)
    const favs = await db.select().from(favorites).where(eq(favorites.mangaSlug, slug));
    const highRates = await db.select().from(ratings).where(eq(ratings.mangaSlug, slug));
    const loverIds = new Set<string>([
      ...favs.map((f) => f.userId),
      ...highRates.filter((r) => r.score >= 7).map((r) => r.userId),
    ]);
    if (loverIds.size === 0) return NextResponse.json({ recommendations: [] });

    // Onların diğer favorileri / yüksek puanları
    const score: Record<string, number> = {};
    const [allFavs, allRates] = await Promise.all([
      db.select().from(favorites).limit(2000),
      db.select().from(ratings).limit(2000),
    ]);
    for (const f of allFavs) {
      if (loverIds.has(f.userId) && f.mangaSlug !== slug) {
        score[f.mangaSlug] = (score[f.mangaSlug] || 0) + 2;
      }
    }
    for (const r of allRates) {
      if (loverIds.has(r.userId) && r.mangaSlug !== slug && r.score >= 7) {
        score[r.mangaSlug] = (score[r.mangaSlug] || 0) + r.score / 5;
      }
    }

    const recommendations = Object.entries(score)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([s]) => getManga(s))
      .filter(Boolean);

    return NextResponse.json({ recommendations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
