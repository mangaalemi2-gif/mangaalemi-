import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { wallPosts, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { maskProfanity } from "@/lib/profanity";
import { floodWait } from "@/lib/moderation";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: ?user=username → duvar yazıları
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("user");
    if (!username) return NextResponse.json({ error: "user gerekli." }, { status: 400 });

    const [u] = await db.select().from(users).where(eq(users.username, username));
    if (!u) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

    const rows = await db
      .select({
        id: wallPosts.id,
        content: wallPosts.content,
        createdAt: wallPosts.createdAt,
        authorId: wallPosts.authorId,
        authorName: users.username,
      })
      .from(wallPosts)
      .leftJoin(users, eq(wallPosts.authorId, users.id))
      .where(and(eq(wallPosts.profileUserId, u.id), eq(wallPosts.isDeleted, false)))
      .orderBy(sql`${wallPosts.createdAt} DESC`)
      .limit(30);

    return NextResponse.json({ posts: rows, profileUserId: u.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Duvara yaz {profileUserId, content}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { profileUserId, content } = (await req.json()) as any;
    if (!profileUserId || !content?.trim()) return NextResponse.json({ error: "Mesaj gerekli." }, { status: 400 });
    if (content.trim().length > 500) return NextResponse.json({ error: "En fazla 500 karakter." }, { status: 400 });

    const wait = await floodWait(db, wallPosts, wallPosts.authorId, wallPosts.createdAt, session.userId, 30);
    if (wait > 0) return NextResponse.json({ error: `Çok hızlı yazıyorsun. ${wait} sn bekle.` }, { status: 429 });

    const id = randomUUID();
    await db.insert(wallPosts).values({
      id,
      profileUserId,
      authorId: session.userId,
      content: maskProfanity(content.trim()),
    });
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: ?id= (yazar, profil sahibi veya admin)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

    const [post] = await db.select().from(wallPosts).where(eq(wallPosts.id, id));
    if (!post) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });

    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (post.authorId !== session.userId && post.profileUserId !== session.userId && me?.role !== "admin") {
      return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
    }
    await db.update(wallPosts).set({ isDeleted: true }).where(eq(wallPosts.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
