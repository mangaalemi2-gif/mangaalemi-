import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, comments, messages, polls, pollVotes, supportTickets, reports, favorites, ratings, follows } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql, gte } from "drizzle-orm";

export const runtime = "nodejs";

function toMs(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  const t = new Date(v).getTime();
  return isNaN(t) ? 0 : t;
}

function dayKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// GET: Site geneli istatistikler (admin)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });

    const count = async (table: any) => {
      const [r] = (await db.select({ n: sql<number>`COUNT(*)` }).from(table)) as any;
      return Number(r?.n ?? 0);
    };

    const [totalUsers, totalComments, totalMessages, totalPolls, totalVotes, totalFavorites, totalRatings, totalFollows, openTickets, pendingReports] =
      await Promise.all([
        count(users),
        count(comments),
        count(messages),
        count(polls),
        count(pollVotes),
        count(favorites),
        count(ratings),
        count(follows),
        db.select({ n: sql<number>`COUNT(*)` }).from(supportTickets).where(eq(supportTickets.status, "open")),
        db.select({ n: sql<number>`COUNT(*)` }).from(reports).where(eq(reports.status, "pending")),
      ]);

    // Son 14 gün: üye + yorum grafiği
    const days: { day: string; users: number; comments: number }[] = [];
    for (let i = 13; i >= 0; i--) days.push({ day: dayKey(-i), users: 0, comments: 0 });

    const allUsers = await db.select({ createdAt: users.createdAt }).from(users).limit(5000);
    for (const u of allUsers) {
      const t = toMs(u.createdAt);
      if (!t) continue;
      const d = new Date(t);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const slot = days.find((x) => x.day === key);
      if (slot) slot.users++;
    }

    const allComments = await db.select({ createdAt: comments.createdAt }).from(comments).limit(5000);
    for (const c of allComments) {
      const t = toMs(c.createdAt);
      if (!t) continue;
      const d = new Date(t);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const slot = days.find((x) => x.day === key);
      if (slot) slot.comments++;
    }

    return NextResponse.json({
      totals: {
        users: totalUsers,
        comments: totalComments,
        messages: totalMessages,
        polls: totalPolls,
        votes: totalVotes,
        favorites: totalFavorites,
        ratings: totalRatings,
        follows: totalFollows,
        openTickets: Number((openTickets[0] as any)?.n ?? 0),
        pendingReports: Number((pendingReports[0] as any)?.n ?? 0),
      },
      days,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
