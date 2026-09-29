import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteSettings, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Bakım durumu + isteyen admin mi? (herkes açık — middleware kullanır)
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const rows = await db.select().from(siteSettings);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value || "";

    let isAdmin = false;
    const session = await getSession(req);
    if (session) {
      const [me] = await db.select().from(users).where(eq(users.id, session.userId));
      isAdmin = me?.role === "admin";
    }

    return NextResponse.json({
      maintenance: map["maintenance_mode"] === "1",
      message: map["maintenance_message"] || "Site şu an bakımda. Kısa süre sonra dönüyoruz.",
      isAdmin,
    });
  } catch (e: any) {
    return NextResponse.json({ maintenance: false, isAdmin: false, message: "" });
  }
}
