import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Bildirimlerim + okunmamış sayısı
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ notifications: [], unread: 0 });
    const db = getDb();

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.userId))
      .orderBy(sql`${notifications.createdAt} DESC`)
      .limit(30);

    const [c] = (await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, session.userId), eq(notifications.isRead, false)))) as any;

    return NextResponse.json({ notifications: rows, unread: Number((c as any)?.n ?? 0) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: {id} tekli okundu / {all:true} tümünü okundu işaretle
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { id, all } = (await req.json()) as any;

    if (all) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, session.userId), eq(notifications.isRead, false)));
    } else if (id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, session.userId)));
    } else {
      return NextResponse.json({ error: "id veya all gerekli." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
