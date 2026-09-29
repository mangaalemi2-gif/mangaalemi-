import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { seriesRequests, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { maskProfanity } from "@/lib/profanity";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: Taleplerim (?all=1 admin)
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const session = await getSession(req);

    if (searchParams.get("all") === "1") {
      if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
      const [me] = await db.select().from(users).where(eq(users.id, session.userId));
      if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
      const rows = await db
        .select({
          id: seriesRequests.id,
          title: seriesRequests.title,
          author: seriesRequests.author,
          description: seriesRequests.description,
          link: seriesRequests.link,
          status: seriesRequests.status,
          adminNote: seriesRequests.adminNote,
          createdAt: seriesRequests.createdAt,
          username: users.username,
        })
        .from(seriesRequests)
        .leftJoin(users, eq(seriesRequests.userId, users.id))
        .orderBy(sql`${seriesRequests.createdAt} DESC`)
        .limit(100);
      return NextResponse.json({ requests: rows });
    }

    if (!session) return NextResponse.json({ requests: [] });
    const rows = await db
      .select()
      .from(seriesRequests)
      .where(eq(seriesRequests.userId, session.userId))
      .orderBy(sql`${seriesRequests.createdAt} DESC`)
      .limit(50);
    return NextResponse.json({ requests: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Seri öner {title, author?, description?, link?}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { title, author, description, link } = (await req.json()) as any;
    if (!title?.trim()) return NextResponse.json({ error: "Seri adı gerekli." }, { status: 400 });

    const id = randomUUID();
    await db.insert(seriesRequests).values({
      id,
      userId: session.userId,
      title: maskProfanity(title.trim()),
      author: author?.trim() || null,
      description: description?.trim() ? maskProfanity(description.trim()) : null,
      link: link?.trim() || null,
      status: "pending",
    });
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: Durum güncelle (admin) {id, status, adminNote?}
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const { id, status, adminNote } = (await req.json()) as any;
    if (!id || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
    }
    await db.update(seriesRequests).set({ status, adminNote: adminNote?.trim() || null }).where(eq(seriesRequests.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
