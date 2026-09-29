import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { announcements, notifications, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: Son duyurular (herkes)
export async function GET(_req: NextRequest) {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        message: announcements.message,
        createdAt: announcements.createdAt,
        username: users.username,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.userId, users.id))
      .orderBy(sql`${announcements.createdAt} DESC`)
      .limit(10);
    return NextResponse.json({ announcements: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Duyuru yayınla (admin) → tüm üyelere bildirim
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const { title, message } = (await req.json()) as any;
    if (!title?.trim()) return NextResponse.json({ error: "Başlık gerekli." }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: "Mesaj gerekli." }, { status: 400 });

    const id = randomUUID();
    await db.insert(announcements).values({
      id,
      userId: session.userId,
      title: title.trim(),
      message: message.trim(),
    });

    // Tüm üyelere bildirim
    const allUsers = await db.select({ id: users.id }).from(users);
    for (const u of allUsers) {
      if (u.id === session.userId) continue;
      await db.insert(notifications).values({
        id: randomUUID(),
        userId: u.id,
        type: "announcement",
        title: title.trim(),
        message: message.trim().slice(0, 200),
        link: "/duyurular",
      });
    }

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
