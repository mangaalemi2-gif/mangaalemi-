import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, referralLog } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { getOrCreateCode, REFERRAL_SIGNUP_BONUS, REFERRAL_RATE } from "@/lib/referrals";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Referans bilgilerim (kod, davet sayısı, kazanç)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();

    const code = await getOrCreateCode(db, session.userId);

    const [inv] = (await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.referredBy, session.userId))) as any;

    const [sum] = (await db
      .select({ total: sql<number>`COALESCE(SUM(${referralLog.amount}), 0)` })
      .from(referralLog)
      .where(eq(referralLog.earnerId, session.userId))) as any;

    const recent = await db
      .select({
        amount: referralLog.amount,
        reason: referralLog.reason,
        createdAt: referralLog.createdAt,
        username: users.username,
      })
      .from(referralLog)
      .leftJoin(users, eq(referralLog.sourceUserId, users.id))
      .where(eq(referralLog.earnerId, session.userId))
      .orderBy(sql`${referralLog.createdAt} DESC`)
      .limit(10);

    return NextResponse.json({
      code,
      invites: Number((inv as any)?.n ?? 0),
      earned: Number((sum as any)?.total ?? 0),
      signupBonus: REFERRAL_SIGNUP_BONUS,
      rate: REFERRAL_RATE,
      recent,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
