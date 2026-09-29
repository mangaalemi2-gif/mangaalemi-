import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql, or, like } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Kullanıcı listesi (admin) — ?q= arama
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    let rows;
    const base = db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        badge: users.badge,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(100);

    if (q) {
      rows = await base.where(or(like(users.username, `%${q}%`), like(users.email, `%${q}%`)));
    } else {
      rows = await base;
    }
    return NextResponse.json({ users: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: Rol / rozet güncelle (admin)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const { id, role, badge } = (await req.json()) as any;
    if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
    if (id === session.userId && role && role !== "admin") {
      return NextResponse.json({ error: "Kendi admin yetkini kaldıramazsın." }, { status: 400 });
    }
    const update: any = {};
    if (role !== undefined) {
      if (!["admin", "editor", "member"].includes(role)) return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
      update.role = role;
    }
    if (badge !== undefined) update.badge = badge?.trim() || null;
    if (Object.keys(update).length === 0) return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });

    await db.update(users).set(update).where(eq(users.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Kullanıcı sil (admin, kendini silemez)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
    if (id === session.userId) return NextResponse.json({ error: "Kendini silemezsin." }, { status: 400 });
    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
