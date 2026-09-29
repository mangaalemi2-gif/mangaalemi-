import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { polls, pollVotes } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// POST: Ankete oy ver (veya oyunu değiştir)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Oy vermek için giriş yapmalısın." }, { status: 401 });

    const db = getDb();
    const { pollId, optionIndex } = (await req.json()) as any;
    if (!pollId || optionIndex === undefined || optionIndex === null) {
      return NextResponse.json({ error: "pollId ve optionIndex gerekli." }, { status: 400 });
    }

    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId));
    if (!poll) return NextResponse.json({ error: "Anket bulunamadı." }, { status: 404 });

    const options = JSON.parse(poll.options) as string[];
    if (optionIndex < 0 || optionIndex >= options.length) {
      return NextResponse.json({ error: "Geçersiz seçenek." }, { status: 400 });
    }

    if (poll.endsAt) {
      const endsAtMs = typeof poll.endsAt === "number" ? poll.endsAt * 1000 : new Date(poll.endsAt as any).getTime();
      if (endsAtMs < Date.now()) return NextResponse.json({ error: "Bu anket sona ermiş." }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(pollVotes)
      .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, session.userId)));

    if (existing.length > 0) {
      await db.update(pollVotes).set({ optionIndex }).where(eq(pollVotes.id, existing[0].id));
    } else {
      await db.insert(pollVotes).values({
        id: randomUUID(),
        pollId,
        userId: session.userId,
        optionIndex,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
