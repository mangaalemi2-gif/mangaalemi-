import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { mangaList, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const STATUSES = ["reading", "completed", "on_hold", "dropped", "planning"];

// GET: Listem (?slug= tek kontrol, ?user=username herkese açık)
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const forUser = searchParams.get("user");

    if (forUser) {
      const [u] = await db.select().from(users).where(eq(users.username, forUser));
      if (!u) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
      const rows = await db
        .select()
        .from(mangaList)
        .where(eq(mangaList.userId, u.id))
        .orderBy(sql`${mangaList.updatedAt} DESC`)
        .limit(200);
      return NextResponse.json({ list: rows });
    }

    const session = await getSession(req);
    if (!session) return NextResponse.json({ list: [], status: null });

    if (slug) {
      const [row] = await db
        .select()
        .from(mangaList)
        .where(and(eq(mangaList.userId, session.userId), eq(mangaList.mangaSlug, slug)));
      return NextResponse.json({ status: row?.status ?? null });
    }

    const rows = await db
      .select()
      .from(mangaList)
      .where(eq(mangaList.userId, session.userId))
      .orderBy(sql`${mangaList.updatedAt} DESC`)
      .limit(200);
    return NextResponse.json({ list: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Durum belirle {mangaSlug, status | null (kaldır)}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { mangaSlug, status } = (await req.json()) as any;
    if (!mangaSlug) return NextResponse.json({ error: "mangaSlug gerekli." }, { status: 400 });

    await db
      .delete(mangaList)
      .where(and(eq(mangaList.userId, session.userId), eq(mangaList.mangaSlug, mangaSlug)));

    if (status && STATUSES.includes(status)) {
      await db.insert(mangaList).values({ id: randomUUID(), userId: session.userId, mangaSlug, status });
      return NextResponse.json({ status });
    }
    return NextResponse.json({ status: null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
