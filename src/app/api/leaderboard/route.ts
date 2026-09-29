import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getLeaderboard } from "@/lib/levels";

export const runtime = "nodejs";

// GET: En aktif üyeler (XP sıralaması)
export async function GET(_req: NextRequest) {
  try {
    const db = getDb();
    const board = await getLeaderboard(db, 20);
    return NextResponse.json({ leaderboard: board });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
