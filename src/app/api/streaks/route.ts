import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getStreak, getGoalProgress } from "@/lib/streaks";

export const runtime = "nodejs";

// GET: Serilerim (okuma + sohbet) + hedefler
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

    return NextResponse.json({ reading, chat, goals });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
