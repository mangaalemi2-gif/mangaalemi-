import { eq, desc, sql } from "drizzle-orm";
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

function toMs(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  const t = new Date(v).getTime();
  return isNaN(t) ? 0 : t;
}

// Flood koruması: kullanıcının tablodaki son kaydından beri limitSeconds geçmediyse beklenecek saniyeyi döndürür (0 = serbest)
export async function floodWait(
  db: any,
  table: any,
  userColumn: any,
  timeColumn: any,
  userId: string,
  limitSeconds: number
): Promise<number> {
  try {
    const rows = await db
      .select()
      .from(table)
      .where(eq(userColumn, userId))
      .orderBy(desc(timeColumn))
      .limit(1);
    if (!rows || rows.length === 0) return 0;
    const last = toMs((rows[0] as any)?.[timeColumn.name] ?? (rows[0] as any)?.createdAt);
    const wait = limitSeconds - Math.floor((Date.now() - last) / 1000);
    return wait > 0 ? wait : 0;
  } catch {
    return 0;
  }
}
