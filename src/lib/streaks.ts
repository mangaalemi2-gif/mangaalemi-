import { eq, and, sql, gte } from "drizzle-orm";
import { dailyActivity, readingGoals } from "./db/schema";

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayStrOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Günlük aktivite artır (upsert)
export async function bumpActivity(
  db: any,
  userId: string,
  inc: { pages?: number; chapters?: number; messages?: number }
) {
  const day = todayStr();
  const existing = await db
    .select()
    .from(dailyActivity)
    .where(and(eq(dailyActivity.userId, userId), eq(dailyActivity.day, day)));
  if (existing.length > 0) {
    const r = existing[0];
    await db
      .update(dailyActivity)
      .set({
        pages: (r.pages || 0) + (inc.pages || 0),
        chapters: (r.chapters || 0) + (inc.chapters || 0),
        messages: (r.messages || 0) + (inc.messages || 0),
      })
      .where(and(eq(dailyActivity.userId, userId), eq(dailyActivity.day, day)));
  } else {
    await db.insert(dailyActivity).values({
      userId,
      day,
      pages: inc.pages || 0,
      chapters: inc.chapters || 0,
      messages: inc.messages || 0,
    });
  }
}

// Streak hesabı: field "pages"|"chapters" (okuma) veya "messages" (sohbet)
export async function getStreak(
  db: any,
  userId: string,
  field: "pages" | "chapters" | "messages"
): Promise<{ current: number; longest: number }> {
  const rows = await db
    .select()
    .from(dailyActivity)
    .where(and(eq(dailyActivity.userId, userId), gte(dailyActivity.day, dayStrOffset(-365))))
    .orderBy(sql`${dailyActivity.day} DESC`);

  const activeDays = new Set<string>(
    rows.filter((r: any) => (r[field] || 0) > 0).map((r: any) => String(r.day))
  );

  // Mevcut seri: bugünden (veya dün) geriye doğru say
  let current = 0;
  let cursor = new Date();
  if (!activeDays.has(todayStr())) {
    // Bugün aktivite yoksa dünden başlat (seri henüz kırılmamış olabilir)
    cursor.setDate(cursor.getDate() - 1);
  }
  while (true) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (activeDays.has(key)) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
    if (current > 365) break;
  }

  // En uzun seri
  const sorted = [...activeDays].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    if (prev) {
      const d1 = new Date(prev + "T00:00:00");
      const d2 = new Date(day + "T00:00:00");
      const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = day;
  }

  return { current, longest };
}

// Hedef ilerlemesi
export async function getGoalProgress(db: any, userId: string) {
  const goals = await db.select().from(readingGoals).where(eq(readingGoals.userId, userId));
  const today = todayStr();
  const weekStart = dayStrOffset(-6);

  const [todayRow] = await db
    .select()
    .from(dailyActivity)
    .where(and(eq(dailyActivity.userId, userId), eq(dailyActivity.day, today)));

  const weekRows = await db
    .select()
    .from(dailyActivity)
    .where(and(eq(dailyActivity.userId, userId), gte(dailyActivity.day, weekStart)));

  const weekChapters = weekRows.reduce((s: number, r: any) => s + (r.chapters || 0), 0);
  const todayPages = (todayRow as any)?.pages || 0;
  const todayMessages = (todayRow as any)?.messages || 0;

  return goals.map((g: any) => {
    let done = 0;
    let label = "";
    if (g.kind === "daily_pages") {
      done = todayPages;
      label = "Günlük sayfa hedefi";
    } else if (g.kind === "weekly_chapters") {
      done = weekChapters;
      label = "Haftalık bölüm hedefi";
    } else if (g.kind === "daily_messages") {
      done = todayMessages;
      label = "Günlük sohbet hedefi";
    }
    return { ...g, done, label, pct: g.target > 0 ? Math.min(100, Math.round((done / g.target) * 100)) : 0 };
  });
}
