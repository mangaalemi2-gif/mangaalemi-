import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ratings } from "@/lib/db/schema";

export const runtime = "nodejs";

// GET: Tüm serilerin ortalama puanı {averages: {slug: {avg, count}}}
export async function GET(_req: NextRequest) {
  try {
    const db = getDb();
    const all = await db.select().from(ratings).limit(5000);
    const map: Record<string, { sum: number; count: number }> = {};
    for (const r of all) {
      map[r.mangaSlug] = map[r.mangaSlug] || { sum: 0, count: 0 };
      map[r.mangaSlug].sum += r.score;
      map[r.mangaSlug].count++;
    }
    const averages: Record<string, { avg: number; count: number }> = {};
    for (const [slug, v] of Object.entries(map)) {
      averages[slug] = { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count };
    }
    return NextResponse.json({ averages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
