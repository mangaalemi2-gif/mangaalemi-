import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ratings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: ?slug= → ortalama, dağılım, benim puanım
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "slug gerekli." }, { status: 400 });
    const session = await getSession(req);

    const all = await db.select().from(ratings).where(eq(ratings.mangaSlug, slug));
    const count = all.length;
    const average = count > 0 ? all.reduce((s, r) => s + r.score, 0) / count : 0;
    const distribution = Array.from({ length: 10 }, (_, i) => all.filter((r) => r.score === i + 1).length);
    const myScore = session ? all.find((r) => r.userId === session.userId)?.score ?? null : null;

    return NextResponse.json({ average: Math.round(average * 10) / 10, count, distribution, myScore });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Puan ver/güncelle {mangaSlug, score 1-10}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Puan vermek için giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { mangaSlug, score } = (await req.json()) as any;
    if (!mangaSlug) return NextResponse.json({ error: "mangaSlug gerekli." }, { status: 400 });
    if (!Number.isInteger(score) || score < 1 || score > 10) {
      return NextResponse.json({ error: "Puan 1-10 arası olmalı." }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, session.userId), eq(ratings.mangaSlug, mangaSlug)));

    if (existing.length > 0) {
      await db.update(ratings).set({ score, updatedAt: new Date() }).where(eq(ratings.id, existing[0].id));
    } else {
      await db.insert(ratings).values({ id: randomUUID(), userId: session.userId, mangaSlug, score });
    }

    const all = await db.select().from(ratings).where(eq(ratings.mangaSlug, mangaSlug));
    const average = all.reduce((s, r) => s + r.score, 0) / all.length;
    return NextResponse.json({ ok: true, average: Math.round(average * 10) / 10, count: all.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
