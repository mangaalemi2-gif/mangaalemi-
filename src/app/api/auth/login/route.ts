import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { verifyPassword, generateSessionToken } from "@/lib/auth";
import { eq, or } from "drizzle-orm";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json() as any;

    if (!identifier || !password) {
      return NextResponse.json({ error: "Kullanıcı adı/email ve şifre gereklidir." }, { status: 400 });
    }

    const env = (request as any).cf?.env || (globalThis as any).process?.env;
    const db = getDb(env);

    // Email veya kullanıcı adı ile bul
    const user = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier.toLowerCase()), eq(users.username, identifier)))
      .get();

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Geçersiz kullanıcı adı/email veya şifre." }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Geçersiz kullanıcı adı/email veya şifre." }, { status: 401 });
    }

    // Oturum oluştur
    const sessionId = generateSessionToken();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        badge: user.badge,
      },
    });

    response.cookies.set("session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Giriş sırasında bir hata oluştu." }, { status: 500 });
  }
}
