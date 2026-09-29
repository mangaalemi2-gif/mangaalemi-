import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { bans, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

async function requireAdmin(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return null;
  const db = getDb();
  const [me] = await db.select().from(users).where(eq(users.id, session.userId));
  if (me?.role !== "admin") return null;
  return { db, session };
}

// GET: Aktif ban listesi (admin)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth) return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
    const rows = await auth.db
      .select({
        id: bans.id,
        userId: bans.userId,
        reason: bans.reason,
        expiresAt: bans.expiresAt,
        createdAt: bans.createdAt,
        username: users.username,
      })
      .from(bans)
      .leftJoin(users, eq(bans.userId, users.id))
      .orderBy(sql`${bans.createdAt} DESC`)
      .limit(100);
    return NextResponse.json({ bans: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Banla {userId, reason, days? (boş = süresiz)}
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth) return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
    const { userId, reason, days } = (await req.json()) as any;
    if (!userId || !reason?.trim()) return NextResponse.json({ error: "userId ve sebep gerekli." }, { status: 400 });
    if (userId === auth.session.userId) return NextResponse.json({ error: "Kendini banlayamazsın." }, { status: 400 });

    // Eski banları temizle, yenisini ekle
    await auth.db.delete(bans).where(eq(bans.userId, userId));
    const expiresAt = days ? Math.floor(Date.now() / 1000) + days * 86400 : null;
    const id = randomUUID();
    await auth.db.insert(bans).values({
      id,
      userId,
      reason: reason.trim(),
      expiresAt,
      createdBy: auth.session.userId,
    });
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Ban kaldır ?id=
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth) return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
    await auth.db.delete(bans).where(eq(bans.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
