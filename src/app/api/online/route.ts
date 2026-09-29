import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Son 5 dakikada aktif olanlar (sayı + örnek)
export async function GET(_req: NextRequest) {
  try {
    const db = getDb();
    const cutoff = Math.floor(Date.now() / 1000) - 5 * 60;

    const rows = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(sql`${users.lastSeen} > ${cutoff}`)
      .limit(50);

    return NextResponse.json({
      count: rows.length,
      sample: rows.slice(0, 10).map((r) => r.username),
    });
  } catch (e: any) {
    return NextResponse.json({ count: 0, sample: [] });
  }
}
