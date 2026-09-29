import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { supportTickets, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: Destek talepleri — ?all=1 ise admin tümünü görür, yoksa kendi talepleri
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all");
    const session = await getSession(req);

    if (all === "1") {
      if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
      const [me] = await db.select().from(users).where(eq(users.id, session.userId));
      if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
      const rows = await db
        .select({
          id: supportTickets.id,
          subject: supportTickets.subject,
          message: supportTickets.message,
          status: supportTickets.status,
          email: supportTickets.email,
          userId: supportTickets.userId,
          createdAt: supportTickets.createdAt,
          updatedAt: supportTickets.updatedAt,
          username: users.username,
        })
        .from(supportTickets)
        .leftJoin(users, eq(supportTickets.userId, users.id))
        .orderBy(sql`${supportTickets.createdAt} DESC`)
        .limit(100);
      return NextResponse.json({ tickets: rows });
    }

    if (!session) return NextResponse.json({ tickets: [] });
    const rows = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, session.userId))
      .orderBy(sql`${supportTickets.createdAt} DESC`)
      .limit(50);
    return NextResponse.json({ tickets: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Destek talebi oluştur (üyeler + misafir e-posta ile)
export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const session = await getSession(req);
    const { subject, message, email } = (await req.json()) as any;

    if (!subject?.trim()) return NextResponse.json({ error: "Konu gerekli." }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: "Mesaj gerekli." }, { status: 400 });
    if (subject.trim().length > 200) return NextResponse.json({ error: "Konu en fazla 200 karakter." }, { status: 400 });
    if (message.trim().length > 5000) return NextResponse.json({ error: "Mesaj en fazla 5000 karakter." }, { status: 400 });
    if (!session && !email?.trim()) return NextResponse.json({ error: "E-posta gerekli (misafir olarak yazıyorsun)." }, { status: 400 });

    const id = randomUUID();
    await db.insert(supportTickets).values({
      id,
      userId: session?.userId ?? null,
      email: email?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: Durum güncelle (admin)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const { id, status } = (await req.json()) as any;
    if (!id || !status) return NextResponse.json({ error: "id ve status gerekli." }, { status: 400 });
    if (!["open", "in_progress", "closed"].includes(status)) return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });

    await db.update(supportTickets).set({ status, updatedAt: new Date() }).where(eq(supportTickets.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
