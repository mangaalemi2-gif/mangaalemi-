import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notificationPrefs } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { PREF_KEYS } from "@/lib/notifications";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const PREF_LABELS: Record<string, string> = {
  reply: "Yorumuma yanıt gelince",
  follow: "Biri beni takip edince",
  mention: "Biri beni etiketleyince",
  announcement: "Duyuru ve yeni bölümler",
  achievement: "Başarım kazanınca",
  streak: "Seri kırılma uyarıları",
};

// GET: Tercihlerim
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ prefs: null });
    const db = getDb();
    const [row] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, session.userId));
    const prefs: Record<string, boolean> = {};
    for (const k of PREF_KEYS) prefs[k] = row ? !!(row as any)[k] : true;
    return NextResponse.json({ prefs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: {key, value} — tek tercihi güncelle
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { key, value } = (await req.json()) as any;
    if (!PREF_KEYS.includes(key)) return NextResponse.json({ error: "Geçersiz tercih." }, { status: 400 });

    const [existing] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, session.userId));
    if (existing) {
      await db.update(notificationPrefs).set({ [key]: !!value, updatedAt: new Date() }).where(eq(notificationPrefs.userId, session.userId));
    } else {
      await db.insert(notificationPrefs).values({ userId: session.userId, [key]: !!value });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
