import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { featured, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: Öne çıkan manga (herkes)
export async function GET(_req: NextRequest) {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(featured)
      .orderBy(sql`${featured.createdAt} DESC`)
      .limit(1);
    return NextResponse.json({ slug: row?.mangaSlug ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Öne çıkar (admin) {mangaSlug}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const { mangaSlug } = (await req.json()) as any;
    if (!mangaSlug) return NextResponse.json({ error: "mangaSlug gerekli." }, { status: 400 });

    await db.delete(featured);
    await db.insert(featured).values({ id: randomUUID(), mangaSlug, createdBy: session.userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Vitrini kaldır (admin)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
    await db.delete(featured);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
