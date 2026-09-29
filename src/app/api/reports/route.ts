import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { reports, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// POST: Bildir (üye gerekli)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Bildirmek için giriş yapmalısın." }, { status: 401 });

    const db = getDb();
    const { targetType, targetId, reason, detail } = (await req.json()) as any;

    if (!targetType || !["user", "comment"].includes(targetType)) {
      return NextResponse.json({ error: "Geçersiz hedef türü." }, { status: 400 });
    }
    if (!targetId) return NextResponse.json({ error: "Hedef gerekli." }, { status: 400 });
    if (!reason?.trim()) return NextResponse.json({ error: "Sebep gerekli." }, { status: 400 });

    // Kendini bildirmeyi engelle
    if (targetType === "user" && targetId === session.userId) {
      return NextResponse.json({ error: "Kendini bildiremezsin." }, { status: 400 });
    }

    const id = randomUUID();
    await db.insert(reports).values({
      id,
      reporterId: session.userId,
      targetType,
      targetId,
      reason: reason.trim(),
      detail: detail?.trim() || null,
      status: "pending",
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: Bildirimler (admin)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let rows;
    const base = db
      .select({
        id: reports.id,
        targetType: reports.targetType,
        targetId: reports.targetId,
        reason: reports.reason,
        detail: reports.detail,
        status: reports.status,
        createdAt: reports.createdAt,
        reporterId: reports.reporterId,
        reporterName: users.username,
      })
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.id))
      .orderBy(sql`${reports.createdAt} DESC`)
      .limit(100);

    if (status && status !== "all") {
      rows = await base.where(eq(reports.status, status));
    } else {
      rows = await base;
    }
    return NextResponse.json({ reports: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: Bildirim durumu (admin)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const { id, status } = (await req.json()) as any;
    if (!id || !status) return NextResponse.json({ error: "id ve status gerekli." }, { status: 400 });
    if (!["pending", "reviewed", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
    }
    await db.update(reports).set({ status }).where(eq(reports.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
