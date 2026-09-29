// Basit şifre hash/doğrulama — Web Crypto API (Cloudflare Workers uyumlu)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Oturum doğrulama — API route'ları için
// Cookie'deki "session" id'sini okuyup sessions tablosunda doğrular.
export async function getSession(req: Request): Promise<{ userId: string; sessionId: string } | null> {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    // NextRequest.cookies varsa onu tercih et
    let sessionId: string | undefined;
    const anyReq = req as any;
    if (anyReq.cookies?.get) {
      sessionId = anyReq.cookies.get("session")?.value;
    }
    if (!sessionId && cookieHeader) {
      const match = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith("session="));
      if (match) sessionId = decodeURIComponent(match.split("=").slice(1).join("="));
    }
    if (!sessionId) return null;

    const { getDb } = await import("@/lib/db");
    const { sessions } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    let db: any = null;
    try {
      db = getDb((anyReq as any).cf?.env);
    } catch {
      return null;
    }

    const rows = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    const session = Array.isArray(rows) ? rows[0] : (await rows.get?.()) ?? rows;
    // drizzle d1 .get() kullanan projelerde rows dizi döner; yukarıdaki yeterli
    if (!session) return null;
    if (session.expiresAt && session.expiresAt < Math.floor(Date.now() / 1000)) {
      try {
        await db.delete(sessions).where(eq(sessions.id, sessionId));
      } catch { /* yoksay */ }
      return null;
    }
    // Çevrimiçi takibi (hata olursa sessiz geç)
    try {
      const { users } = await import("@/lib/db/schema");
      await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, session.userId));
    } catch { /* yoksay */ }
    return { userId: session.userId, sessionId: session.id };
  } catch {
    return null;
  }
}
