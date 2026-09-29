import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getStreak, getGoalProgress, todayStr } from "@/lib/streaks";
import { notify } from "@/lib/notifications";
import { dailyActivity, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Serilerim (okuma + sohbet) + hedefler (+ kırılma uyarısı)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();

    const [readingPages, readingChapters, chat] = await Promise.all([
      getStreak(db, session.userId, "pages"),
      getStreak(db, session.userId, "chapters"),
      getStreak(db, session.userId, "messages"),
    ]);
    const reading = {
      current: Math.max(readingPages.current, readingChapters.current),
      longest: Math.max(readingPages.longest, readingChapters.longest),
    };
    const goals = await getGoalProgress(db, session.userId);

    // Seri kırılma uyarısı: seri varsa ama bugün aktivite yoksa, günde 1 kez bildir
    try {
      const today = todayStr();
      const [todayRow] = await db
        .select()
        .from(dailyActivity)
        .where(and(eq(dailyActivity.userId, session.userId), eq(dailyActivity.day, today)));
      const readToday = ((todayRow as any)?.pages || 0) > 0 || ((todayRow as any)?.chapters || 0) > 0;
      const chatToday = ((todayRow as any)?.messages || 0) > 0;

      const warnings: { type: string; streak: number }[] = [];
      if (reading.current > 0 && !readToday) warnings.push({ type: "reading", streak: reading.current });
      if (chat.current > 0 && !chatToday) warnings.push({ type: "chat", streak: chat.current });

      for (const w of warnings) {
        const kind = `streak-warning-${w.type}`;
        const existing = await db
          .select()
          .from(notifications)
          .where(and(eq(notifications.userId, session.userId), eq(notifications.type, kind)));
        const sentToday = existing.some((n: any) => {
          const t = typeof n.createdAt === "number" ? n.createdAt * 1000 : new Date(n.createdAt).getTime();
          const d = new Date(t);
          const now = new Date();
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
        });
        if (!sentToday) {
          await notify(db, {
            userId: session.userId,
            type: kind,
            title: w.type === "reading" ? "🔥 Okuma serin kırılmak üzere!" : "💬 Sohbet serin kırılmak üzere!",
            message: `${w.streak} günlük seriyi korumak için bugün ${w.type === "reading" ? "bir bölüm oku" : "bir mesaj yaz"}.`,
            link: w.type === "reading" ? "/ara" : "/sohbet",
          });
        }
      }
    } catch { /* yoksay */ }

    return NextResponse.json({ reading, chat, goals });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
