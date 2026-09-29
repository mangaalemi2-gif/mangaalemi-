import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteSettings, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Tüm ayarlar (admin)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
    const rows = await db.select().from(siteSettings);
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.key] = r.value || "";
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Ayar kaydet (admin) {key, value}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const { key, value } = (await req.json()) as any;
    const allowed = ["maintenance_mode", "maintenance_message", "discord_webhook"];
    if (!allowed.includes(key)) return NextResponse.json({ error: "Geçersiz ayar." }, { status: 400 });

    if (key === "discord_webhook" && value && !/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(value)) {
      return NextResponse.json({ error: "Geçerli bir Discord webhook URL'si gir." }, { status: 400 });
    }

    await db.delete(siteSettings).where(eq(siteSettings.key, key));
    await db.insert(siteSettings).values({ key, value: value || "" });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
