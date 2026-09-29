import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;

    if (!sessionId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const env = (request as any).cf?.env || (globalThis as any).process?.env;
    const db = getDb(env);

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();

    if (!session || session.expiresAt < Math.floor(Date.now() / 1000)) {
      // Süresi dolmuş oturumu sil
      if (session) {
        await db.delete(sessions).where(eq(sessions.id, sessionId));
      }
      const response = NextResponse.json({ user: null }, { status: 401 });
      response.cookies.delete("session");
      return response;
    }

    const user = await db.select().from(users).where(eq(users.id, session.userId)).get();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: (user as any).bio ?? null,
        badge: user.badge,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Me error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
