import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sessions, readingHistory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId } from "@/lib/auth";

export const runtime = "nodejs";

// Okuma geçmişini kaydet/güncelle
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const env = (request as any).cf?.env || (globalThis as any).process?.env;
    const db = getDb(env);

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });
    }

    const { mangaSlug, chapterNumber, pageNumber } = await request.json() as any;

    // Mevcut kayıt var mı?
    const existing = await db
      .select()
      .from(readingHistory)
      .where(and(eq(readingHistory.userId, session.userId), eq(readingHistory.mangaSlug, mangaSlug)))
      .get();

    if (existing) {
      await db
        .update(readingHistory)
        .set({
          chapterNumber,
          pageNumber: pageNumber || 1,
          updatedAt: new Date(),
        })
        .where(eq(readingHistory.id, existing.id));
    } else {
      await db.insert(readingHistory).values({
        id: generateId(),
        userId: session.userId,
        mangaSlug,
        chapterNumber,
        pageNumber: pageNumber || 1,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reading history error:", error);
    return NextResponse.json({ error: "Hata oluştu." }, { status: 500 });
  }
}

// Okuma geçmişini getir
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ history: [] });
    }

    const env = (request as any).cf?.env || (globalThis as any).process?.env;
    const db = getDb(env);

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return NextResponse.json({ history: [] });
    }

    const history = await db
      .select()
      .from(readingHistory)
      .where(eq(readingHistory.userId, session.userId))
      .all();

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("Reading history error:", error);
    return NextResponse.json({ history: [] });
  }
}
