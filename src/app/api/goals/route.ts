import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { readingGoals } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { getGoalProgress } from "@/lib/streaks";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const KINDS = ["daily_pages", "weekly_chapters", "daily_messages"];

// GET: Hedeflerim + ilerleme
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ goals: [] });
    const db = getDb();
    const goals = await getGoalProgress(db, session.userId);
    return NextResponse.json({ goals });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Hedef belirle/güncelle {kind, target} (target 0 = kaldır)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { kind, target } = (await req.json()) as any;
    if (!KINDS.includes(kind)) return NextResponse.json({ error: "Geçersiz hedef türü." }, { status: 400 });
    const t = parseInt(target);
    if (isNaN(t) || t < 0 || t > 10000) return NextResponse.json({ error: "Geçersiz hedef değeri." }, { status: 400 });

    await db.delete(readingGoals).where(and(eq(readingGoals.userId, session.userId), eq(readingGoals.kind, kind)));
    if (t > 0) {
      await db.insert(readingGoals).values({ id: randomUUID(), userId: session.userId, kind, target: t });
    }
    const goals = await getGoalProgress(db, session.userId);
    return NextResponse.json({ goals });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
