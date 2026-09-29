import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { hashPassword, generateId, generateSessionToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json() as any;

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }

    const env = (request as any).cf?.env || (globalThis as any).process?.env;
    // Cloudflare Workers ortamında D1'e erişim
    const db = getDb(env);

    // Kullanıcı adı veya email zaten var mı kontrol et
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      return NextResponse.json({ error: "Bu email adresi zaten kullanılıyor." }, { status: 409 });
    }

    const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
    if (existingUsername) {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 });
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      id: userId,
      username,
      email: email.toLowerCase(),
      passwordHash,
      role: "member",
    });

    // Oturum oluştur
    const sessionId = generateSessionToken();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 gün

    await db.insert(sessions).values({
      id: sessionId,
      userId,
      expiresAt,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: userId, username, email, role: "member" },
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
    console.error("Register error:", error);
    return NextResponse.json({ error: "Kayıt sırasında bir hata oluştu: " + error?.message }, { status: 500 });
  }
}
