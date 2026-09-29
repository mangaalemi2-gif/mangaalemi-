import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { blocks, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: Engellediklerim (id listesi)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ blocked: [] });
    const db = getDb();
    const rows = await db.select().from(blocks).where(eq(blocks.blockerId, session.userId));
    return NextResponse.json({ blocked: rows.map((r) => r.blockedId) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Engelle/engeli kaldır (toggle) {targetUserId}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { targetUserId } = (await req.json()) as any;
    if (!targetUserId) return NextResponse.json({ error: "targetUserId gerekli." }, { status: 400 });
    if (targetUserId === session.userId) return NextResponse.json({ error: "Kendini engelleyemezsin." }, { status: 400 });

    const [target] = await db.select().from(users).where(eq(users.id, targetUserId));
    if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    if (target.role === "admin") return NextResponse.json({ error: "Admin engellenemez." }, { status: 403 });

    const existing = await db
      .select()
      .from(blocks)
      .where(and(eq(blocks.blockerId, session.userId), eq(blocks.blockedId, targetUserId)));

    if (existing.length > 0) {
      await db.delete(blocks).where(eq(blocks.id, existing[0].id));
      return NextResponse.json({ blocked: false });
    }
    await db.insert(blocks).values({ id: randomUUID(), blockerId: session.userId, blockedId: targetUserId });
    return NextResponse.json({ blocked: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
