import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { badges, userBadges, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { getUserXp } from "@/lib/levels";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: Mağaza (rozetler + sahiplik + XP'im). ?user=username → birinin rozetleri
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const forUser = searchParams.get("user");
    const session = await getSession(req);

    const all = await db.select().from(badges).orderBy(sql`${badges.costXp} ASC`);

    if (forUser) {
      const [u] = await db.select().from(users).where(eq(users.username, forUser));
      if (!u) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
      const owned = await db.select().from(userBadges).where(eq(userBadges.userId, u.id));
      const ownedIds = new Set(owned.map((o) => o.badgeId));
      return NextResponse.json({
        badges: all.filter((b) => ownedIds.has(b.id)),
        showcase: (u as any).badge ?? null,
      });
    }

    if (!session) return NextResponse.json({ badges: all, owned: [], xp: 0 });
    const owned = await db.select().from(userBadges).where(eq(userBadges.userId, session.userId));
    const xp = await getUserXp(db, session.userId);
    return NextResponse.json({ badges: all, owned: owned.map((o) => o.badgeId), xp });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: {action: "buy", badgeId} veya {action: "showcase", badgeId | null}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { action, badgeId } = (await req.json()) as any;

    if (action === "showcase") {
      if (badgeId) {
        const owned = await db
          .select()
          .from(userBadges)
          .where(and(eq(userBadges.userId, session.userId), eq(userBadges.badgeId, badgeId)));
        if (owned.length === 0) return NextResponse.json({ error: "Bu rozete sahip değilsin." }, { status: 403 });
        const [b] = await db.select().from(badges).where(eq(badges.id, badgeId));
        await db.update(users).set({ badge: `${b.icon} ${b.name}` }).where(eq(users.id, session.userId));
      } else {
        await db.update(users).set({ badge: null }).where(eq(users.id, session.userId));
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "buy") {
      const [b] = await db.select().from(badges).where(eq(badges.id, badgeId));
      if (!b) return NextResponse.json({ error: "Rozet bulunamadı." }, { status: 404 });
      const owned = await db
        .select()
        .from(userBadges)
        .where(and(eq(userBadges.userId, session.userId), eq(userBadges.badgeId, badgeId)));
      if (owned.length > 0) return NextResponse.json({ error: "Zaten sahipsin." }, { status: 400 });
      const xp = await getUserXp(db, session.userId);
      if (xp < b.costXp) return NextResponse.json({ error: `Yetersiz XP (${xp}/${b.costXp}).` }, { status: 400 });
      await db.insert(userBadges).values({ userId: session.userId, badgeId });
      return NextResponse.json({ ok: true, xp });
    }

    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
