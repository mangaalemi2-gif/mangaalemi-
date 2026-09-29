import { eq, and, sql, isNull } from "drizzle-orm";
import { bans } from "./db/schema";

// Aktif ban var mı? Varsa ban kaydını döndürür.
export async function getActiveBan(db: any, userId: string): Promise<any | null> {
  const now = Math.floor(Date.now() / 1000);
  const rows = await db.select().from(bans).where(eq(bans.userId, userId));
  for (const b of rows) {
    const exp = (b as any).expiresAt;
    const expSec = exp === null || exp === undefined ? null : typeof exp === "number" ? exp : Math.floor(new Date(exp as any).getTime() / 1000);
    if (expSec === null || expSec > now) return b;
  }
  return null;
}

export function banMessage(ban: any): string {
  const exp = ban?.expiresAt;
  if (exp === null || exp === undefined) return `Uzaklaştırıldın (süresiz). Sebep: ${ban?.reason || "-"}`;
  const d = new Date(typeof exp === "number" ? exp * 1000 : exp);
  return `Uzaklaştırıldın (${d.toLocaleDateString("tr-TR")} tarihine kadar). Sebep: ${ban?.reason || "-"}`;
}
