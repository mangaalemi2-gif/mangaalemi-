import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { notifications, notificationPrefs } from "./db/schema";

export const PREF_KEYS = ["reply", "follow", "mention", "announcement", "achievement", "streak"] as const;

function prefKey(type: string): string {
  if (type.startsWith("streak")) return "streak";
  return type;
}

// Kullanıcı bu bildirim türünü istiyor mu? (kayıt yoksa varsayılan: açık)
export async function shouldNotify(db: any, userId: string, type: string): Promise<boolean> {
  try {
    const key = prefKey(type);
    if (!PREF_KEYS.includes(key as any)) return true;
    const [row] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId));
    if (!row) return true;
    return (row as any)[key] !== false && (row as any)[key] !== 0;
  } catch {
    return true;
  }
}

// Tercihe saygılı bildirim oluştur. Gönderildiyse true.
export async function notify(
  db: any,
  input: { userId: string; type: string; title: string; message?: string | null; link?: string | null }
): Promise<boolean> {
  try {
    if (!(await shouldNotify(db, input.userId, input.type))) return false;
    await db.insert(notifications).values({
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message || null,
      link: input.link || null,
    });
    return true;
  } catch {
    return false;
  }
}
