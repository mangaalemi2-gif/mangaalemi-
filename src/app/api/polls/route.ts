import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { polls, pollVotes, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { maskProfanity } from "@/lib/profanity";
import { getActiveBan, banMessage, floodWait } from "@/lib/moderation";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: Anketleri listele
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const session = await getSession(req);

    const rows = await db
      .select({
        id: polls.id,
        question: polls.question,
        options: polls.options,
        endsAt: polls.endsAt,
        createdAt: polls.createdAt,
        userId: polls.userId,
        username: users.username,
        voteCount: sql<number>`(SELECT COUNT(*) FROM poll_votes WHERE poll_id = ${polls.id})`,
      })
      .from(polls)
      .leftJoin(users, eq(polls.userId, users.id))
      .orderBy(sql`${polls.createdAt} DESC`)
      .limit(20);

    // Kullanıcının oy verdiklerini bul
    let userVotes: Record<string, number> = {};
    if (session) {
      const votes = await db.select().from(pollVotes).where(eq(pollVotes.userId, session.userId));
      votes.forEach((v) => { userVotes[v.pollId] = v.optionIndex; });
    }

    // Her anket için oy dağılımı
    const withStats = await Promise.all(
      rows.map(async (p) => {
        const votes = await db.select().from(pollVotes).where(eq(pollVotes.pollId, p.id));
        const options = JSON.parse(p.options) as string[];
        const voteCounts = options.map((_, i) => votes.filter((v) => v.optionIndex === i).length);
        return {
          ...p,
          options,
          voteCounts,
          userVote: userVotes[p.id] ?? null,
        };
      })
    );

    return NextResponse.json({ polls: withStats });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Anket oluştur
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

    const db = getDb();
    const { question, options, endsAt } = await req.json() as any;

    const ban = await getActiveBan(db, session.userId);
    if (ban) return NextResponse.json({ error: banMessage(ban) }, { status: 403 });

    const wait = await floodWait(db, polls, polls.userId, polls.createdAt, session.userId, 120);
    if (wait > 0) return NextResponse.json({ error: `Art arda anket açamazsın. ${wait} sn bekle.` }, { status: 429 });

    if (!question?.trim()) return NextResponse.json({ error: "Soru gerekli." }, { status: 400 });
    if (question.trim().length > 300) return NextResponse.json({ error: "Soru en fazla 300 karakter olabilir." }, { status: 400 });
    if (!Array.isArray(options) || options.length < 2) return NextResponse.json({ error: "En az 2 seçenek gerekli." }, { status: 400 });
    const cleanOptions = options.map((o: string) => (o || "").trim()).filter(Boolean);
    if (cleanOptions.length < 2) return NextResponse.json({ error: "En az 2 geçerli seçenek gerekli." }, { status: 400 });
    if (cleanOptions.length > 6) return NextResponse.json({ error: "En fazla 6 seçenek olabilir." }, { status: 400 });

    let endsAtVal: any = null;
    if (endsAt) {
      const t = new Date(endsAt).getTime();
      if (!isNaN(t) && t > Date.now()) endsAtVal = new Date(t);
    }

    const id = randomUUID();
    await db.insert(polls).values({
      id,
      userId: session.userId,
      question: maskProfanity(question.trim()),
      options: JSON.stringify(cleanOptions.map((o) => maskProfanity(o))),
      endsAt: endsAtVal,
    });

    try {
      const { awardReferralBonus } = await import("@/lib/referrals");
      await awardReferralBonus(db, session.userId, 3, "poll");
    } catch { /* yoksay */ }

    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Anket sil (sahibi veya admin)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID gerekli." }, { status: 400 });
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    if (!poll) return NextResponse.json({ error: "Anket bulunamadı." }, { status: 404 });
    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (poll.userId !== session.userId && me?.role !== "admin") {
      return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
    }
    await db.delete(polls).where(eq(polls.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
