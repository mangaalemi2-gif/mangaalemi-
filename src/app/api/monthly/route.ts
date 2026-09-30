import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { polls, pollVotes, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { MANGAS } from "@/data/mangas";
import { eq, sql, like } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function monthlyQuestion(d = new Date()): string {
  return `Ayın Serisi — ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}

async function withStats(db: any, p: any, userId: string | null) {
  const votes = await db.select().from(pollVotes).where(eq(pollVotes.pollId, p.id));
  const options = JSON.parse(p.options) as string[];
  const voteCounts = options.map((_, i) => votes.filter((v: any) => v.optionIndex === i).length);
  const mine = userId ? votes.find((v: any) => v.userId === userId) : null;
  return {
    ...p,
    options,
    voteCounts,
    voteCount: votes.length,
    userVote: mine ? mine.optionIndex : null,
  };
}

// GET: Bu ayın anketi (?history=1 → geçmiş aylar kazananlarıyla)
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const session = await getSession(req);
    const q = monthlyQuestion();

    if (searchParams.get("history") === "1") {
      const rows = await db
        .select()
        .from(polls)
        .where(like(polls.question, "Ayın Serisi — %"))
        .orderBy(sql`${polls.createdAt} DESC`)
        .limit(12);
      const withAll = await Promise.all(rows.map((p: any) => withStats(db, p, session?.userId ?? null)));
      return NextResponse.json({ history: withAll });
    }

    const [poll] = await db.select().from(polls).where(eq(polls.question, q));
    if (!poll) return NextResponse.json({ poll: null });
    return NextResponse.json({ poll: await withStats(db, poll, session?.userId ?? null) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Bu ayın anketini başlat (yoksa oluşturur)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const q = monthlyQuestion();

    const [existing] = await db.select().from(polls).where(eq(polls.question, q));
    if (existing) return NextResponse.json({ poll: await withStats(db, existing, session.userId) });

    const now = new Date();
    const endsAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const id = randomUUID();
    await db.insert(polls).values({
      id,
      userId: session.userId,
      question: q,
      options: JSON.stringify(MANGAS.map((m) => m.title)),
      endsAt: Math.floor(endsAt.getTime() / 1000),
    });
    const [created] = await db.select().from(polls).where(eq(polls.id, id));
    return NextResponse.json({ poll: await withStats(db, created, session.userId) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
