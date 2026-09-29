import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { comments, commentLikes, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, sql, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET: Yorumları listele
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const context = searchParams.get("context");
    const slug = searchParams.get("slug");
    const chapter = searchParams.get("chapter");
    const all = searchParams.get("all");
    const mine = searchParams.get("mine");

    // Admin tüm yorumlar
    if (all === "1") {
      const session = await getSession(req);
      if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
      const [me] = await db.select().from(users).where(eq(users.id, session.userId));
      if (me?.role !== "admin") return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
      const rows = await db
        .select({
          id: comments.id,
          content: comments.content,
          parentId: comments.parentId,
          context: comments.context,
          slug: comments.slug,
          chapter: comments.chapter,
          createdAt: comments.createdAt,
          userId: comments.userId,
          username: users.username,
          avatarUrl: users.avatarUrl,
          badge: users.badge,
          role: users.role,
          likeCount: sql<number>`(SELECT COUNT(*) FROM comment_likes WHERE comment_id = ${comments.id})`,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.isDeleted, false))
        .orderBy(sql`${comments.createdAt} DESC`)
        .limit(100);
      return NextResponse.json({ comments: rows });
    }

    // Kendi yorumlarım (profil sayfası)
    if (mine === "1") {
      const session = await getSession(req);
      if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
      const rows = await db
        .select({
          id: comments.id,
          content: comments.content,
          parentId: comments.parentId,
          context: comments.context,
          slug: comments.slug,
          chapter: comments.chapter,
          createdAt: comments.createdAt,
          userId: comments.userId,
          username: users.username,
          avatarUrl: users.avatarUrl,
          badge: users.badge,
          role: users.role,
          likeCount: sql<number>`(SELECT COUNT(*) FROM comment_likes WHERE comment_id = ${comments.id})`,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(and(eq(comments.userId, session.userId), eq(comments.isDeleted, false)))
        .orderBy(sql`${comments.createdAt} DESC`)
        .limit(50);
      return NextResponse.json({ comments: rows });
    }

    const ctx = context || "chat";
    let whereConditions: any[] = [eq(comments.context, ctx), eq(comments.isDeleted, false), isNull(comments.parentId)];
    if (slug) whereConditions.push(eq(comments.slug, slug));
    if (chapter) whereConditions.push(eq(comments.chapter, chapter));

    const rows = await db
      .select({
        id: comments.id,
        content: comments.content,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        userId: comments.userId,
        username: users.username,
        avatarUrl: users.avatarUrl,
        badge: users.badge,
        role: users.role,
        likeCount: sql<number>`(SELECT COUNT(*) FROM comment_likes WHERE comment_id = ${comments.id})`,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(and(...whereConditions))
      .orderBy(sql`${comments.createdAt} DESC`)
      .limit(50);

    // Her yorumun yanıtlarını da çek
    const withReplies = await Promise.all(
      rows.map(async (r) => {
        const replies = await db
          .select({
            id: comments.id,
            content: comments.content,
            parentId: comments.parentId,
            createdAt: comments.createdAt,
            userId: comments.userId,
            username: users.username,
            avatarUrl: users.avatarUrl,
            badge: users.badge,
            role: users.role,
            likeCount: sql<number>`(SELECT COUNT(*) FROM comment_likes WHERE comment_id = ${comments.id})`,
          })
          .from(comments)
          .leftJoin(users, eq(comments.userId, users.id))
          .where(and(eq(comments.parentId, r.id), eq(comments.isDeleted, false)))
          .orderBy(sql`${comments.createdAt} ASC`);
        return { ...r, replies };
      })
    );

    return NextResponse.json({ comments: withReplies });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Yorum ekle
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

    const db = getDb();
    const body = await req.json() as any;
    const { content, context, slug, chapter, parentId } = body;

    if (!content?.trim()) return NextResponse.json({ error: "Yorum boş olamaz." }, { status: 400 });
    if (content.trim().length > 2000) return NextResponse.json({ error: "Yorum en fazla 2000 karakter olabilir." }, { status: 400 });
    if (!context) return NextResponse.json({ error: "Context gerekli." }, { status: 400 });
    if (!["chapter", "manga", "chat", "feedback"].includes(context)) return NextResponse.json({ error: "Geçersiz context." }, { status: 400 });

    const id = randomUUID();
    await db.insert(comments).values({
      id,
      userId: session.userId,
      context,
      slug: slug || null,
      chapter: chapter || null,
      parentId: parentId || null,
      content: content.trim(),
    });

    // Yeni yorumu kullanıcı bilgileriyle döndür
    const [newComment] = await db
      .select({
        id: comments.id,
        content: comments.content,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        userId: comments.userId,
        username: users.username,
        avatarUrl: users.avatarUrl,
        badge: users.badge,
        role: users.role,
        likeCount: sql<number>`0`,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, id));

    return NextResponse.json({ comment: { ...newComment, replies: [] } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Yorum sil (kendi yorumu veya admin)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("id");
    if (!commentId) return NextResponse.json({ error: "Comment ID gerekli." }, { status: 400 });

    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId));
    if (!comment) return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });

    // Kullanıcı kendi yorumunu veya admin tümünü silebilir
    const [user] = await db.select().from(users).where(eq(users.id, session.userId));
    if (comment.userId !== session.userId && user?.role !== "admin") {
      return NextResponse.json({ error: "Yetkin yok." }, { status: 403 });
    }

    await db.update(comments).set({ isDeleted: true }).where(eq(comments.id, commentId));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
