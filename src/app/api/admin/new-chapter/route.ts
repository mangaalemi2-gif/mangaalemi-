import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { announcements, notifications, users, seriesFollows, siteSettings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { getManga, mangaCover } from "@/data/mangas";
import { SITE_URL } from "@/lib/site";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// POST: Yeni bölüm duyur (admin) {mangaSlug, chapter} → seri takipçilerine bildirim
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const { mangaSlug, chapter } = (await req.json()) as any;
    if (!mangaSlug || !chapter) return NextResponse.json({ error: "mangaSlug ve chapter gerekli." }, { status: 400 });

    const meta = getManga(mangaSlug);
    const title = `Yeni Bölüm: ${meta?.title || mangaSlug} – Bölüm ${chapter}`;
    const message = `${meta?.title || mangaSlug} serisinin ${chapter}. bölümü yayında! Hemen oku.`;
    const link = `/manga/${mangaSlug}/${chapter}`;

    const id = randomUUID();
    await db.insert(announcements).values({ id, userId: session.userId, title, message });

    const followers = await db.select().from(seriesFollows).where(eq(seriesFollows.mangaSlug, mangaSlug));
    for (const f of followers) {
      await db.insert(notifications).values({
        id: randomUUID(),
        userId: f.userId,
        type: "announcement",
        title,
        message,
        link,
      });
    }

    // Discord webhook'a düş (ayarlıysa)
    let discordSent = false;
    try {
      const [hook] = await db.select().from(siteSettings).where(eq(siteSettings.key, "discord_webhook"));
      const url = (hook as any)?.value;
      if (url) {
        const meta2 = meta ? { cover: mangaCover(meta) } : null;
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "MangaAlemi",
            embeds: [
              {
                title,
                description: message,
                url: `${SITE_URL}${link}`,
                color: 37632,
                ...(meta2 ? { thumbnail: { url: `${SITE_URL}${meta2.cover}` } } : {}),
              },
            ],
          }),
        });
        discordSent = true;
      }
    } catch { /* discord hatası duyuruyu engellemesin */ }

    return NextResponse.json({ id, notified: followers.length, discordSent });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
