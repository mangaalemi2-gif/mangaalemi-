import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { users, referralLog } from "./db/schema";
import { notify } from "./notifications";

// Oranlar
export const REFERRAL_SIGNUP_BONUS = 100; // davetle kayıt olan başına
export const REFERRAL_RATE = 0.2; // davetlinin çekirdek kazancının %20'si davetçiye

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

// Varsa döndür, yoksa üret (çakışmasız)
export async function getOrCreateCode(db: any, userId: string): Promise<string> {
  const [me] = await db.select().from(users).where(eq(users.id, userId));
  if ((me as any)?.referralCode) return (me as any).referralCode;
  for (let i = 0; i < 5; i++) {
    const code = makeCode();
    const [existing] = await db.select().from(users).where(eq(users.referralCode, code));
    if (!existing) {
      await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
      return code;
    }
  }
  // Son çare: id tabanlı
  const fallback = `U${userId.slice(0, 7).toUpperCase()}`;
  await db.update(users).set({ referralCode: fallback }).where(eq(users.id, userId));
  return fallback;
}

// Davetlinin bir eyleminden davetçiye oransal komisyon
export async function awardReferralBonus(db: any, sourceUserId: string, baseXp: number, reason: string): Promise<void> {
  try {
    const [u] = await db.select().from(users).where(eq(users.id, sourceUserId));
    const referrerId = (u as any)?.referredBy;
    if (!referrerId) return;
    const amount = Math.max(1, Math.round(baseXp * REFERRAL_RATE));
    await db.update(users).set({ bonusXp: sql`${users.bonusXp} + ${amount}` }).where(eq(users.id, referrerId));
    await db.insert(referralLog).values({
      id: randomUUID(),
      earnerId: referrerId,
      sourceUserId,
      amount,
      reason,
    });
  } catch { /* yoksay */ }
}

// Kayıt bonusu
export async function awardSignupBonus(db: any, referrerId: string, newUsername: string, newUserId: string): Promise<void> {
  try {
    await db.update(users).set({ bonusXp: sql`${users.bonusXp} + ${REFERRAL_SIGNUP_BONUS}` }).where(eq(users.id, referrerId));
    await db.insert(referralLog).values({
      id: randomUUID(),
      earnerId: referrerId,
      sourceUserId: newUserId,
      amount: REFERRAL_SIGNUP_BONUS,
      reason: "signup",
    });
    await notify(db, {
      userId: referrerId,
      type: "achievement",
      title: `🎉 Davetin işe yaradı!`,
      message: `@${newUsername} senin linkinle kaydoldu. +${REFERRAL_SIGNUP_BONUS} XP kazandın!`,
      link: "/profile",
    });
  } catch { /* yoksay */ }
}
