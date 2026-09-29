import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { comments, commentLikes, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { maskProfanity } from "@/lib/profanity";
import { getActiveBan, banMessage, floodWait } from "@/lib/moderation";
import { bumpActivity } from "@/lib/streaks";
import { notify } from "@/lib/notifications";
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
          isSpoiler: comments.isSpoiler,
          isEdited: comments.isEdited,
          imageUrl: comments.imageUrl,
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
          isSpoiler: comments.isSpoiler,
          isEdited: comments.isEdited,
          imageUrl: comments.imageUrl,
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
        isSpoiler: comments.isSpoiler,
        isEdited: comments.isEdited,
        imageUrl: comments.imageUrl,
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
            isSpoiler: comments.isSpoiler,
            isEdited: comments.isEdited,
            imageUrl: comments.imageUrl,
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

    // Ban kontrolü
    const ban = await getActiveBan(db, session.userId);
    if (ban) return NextResponse.json({ error: banMessage(ban) }, { status: 403 });

    // Flood koruması (30 sn)
    const wait = await floodWait(db, comments, comments.userId, comments.createdAt, session.userId, 30);
    if (wait > 0) return NextResponse.json({ error: `Çok hızlı yazıyorsun. ${wait} sn bekle.` }, { status: 429 });

    const body = await req.json() as any;
    const { content, context, slug, chapter, parentId, isSpoiler, imageUrl } = body;

    if (!content?.trim() && !imageUrl) return NextResponse.json({ error: "Yorum boş olamaz." }, { status: 400 });
    if (content?.trim() && content.trim().length > 2000) return NextResponse.json({ error: "Yorum en fazla 2000 karakter olabilir." }, { status: 400 });
    if (!context) return NextResponse.json({ error: "Context gerekli." }, { status: 400 });
    if (!["chapter", "manga", "chat", "feedback"].includes(context)) return NextResponse.json({ error: "Geçersiz context." }, { status: 400 });
    if (imageUrl && !String(imageUrl).startsWith("/api/uploads/comments/")) {
      return NextResponse.json({ error: "Geçersiz resim." }, { status: 400 });
    }

    // Küfür filtresi
    const cleanContent = maskProfanity((content || "").trim());

    const id = randomUUID();
    await db.insert(comments).values({
      id,
      userId: session.userId,
      context,
      slug: slug || null,
      chapter: chapter || null,
      parentId: parentId || null,
      content: cleanContent,
      isSpoiler: !!isSpoiler,
      imageUrl: imageUrl || null,
    });

    // Yanıtsa, ana yorumun sahibine bildirim gönder
    if (parentId) {
      try {
        const [parent] = await db.select().from(comments).where(eq(comments.id, parentId));
        if (parent && parent.userId !== session.userId) {
          const [me] = await db.select().from(users).where(eq(users.id, session.userId));
          await notify(db, {
            userId: parent.userId,
            type: "reply",
            title: "Yorumuna yanıt geldi",
            message: `@${(me as any)?.username ?? "Biri"} yorumuna yanıt yazdı: "${cleanContent.slice(0, 100)}"`,
            link: parent.slug ? `/manga/${parent.slug}${parent.chapter ? `/${parent.chapter}` : ""}` : "/sohbet",
          });
        }
      } catch { /* bildirim hatası yorumu engellemesin */ }
    }

    // @mention bildirimleri + sohbet aktivitesi (streak için)
    try {
      await bumpActivity(db, session.userId, { messages: 1 });
      const mentions = [...new Set([...cleanContent.matchAll(/@([a-zA-Z0-9_çÇğĞıİöÖşŞüÜ]{3,30})/g)].map((m) => m[1]))];
      if (mentions.length > 0) {
        const [me] = await db.select().from(users).where(eq(users.id, session.userId));
        for (const name of mentions.slice(0, 5)) {
          if (name.toLowerCase() === String((me as any)?.username || "").toLowerCase()) continue;
          const [target] = await db.select().from(users).where(eq(users.username, name));
          if (target && target.id !== session.userId) {
            await notify(db, {
              userId: target.id,
              type: "mention",
              title: "Biri seni etiketledi",
              message: `@${(me as any)?.username} bir yorumda senden bahsetti: "${cleanContent.slice(0, 100)}"`,
              link: slug ? `/manga/${slug}${chapter ? `/${chapter}` : ""}` : context === "chat" ? "/sohbet" : "/",
            });
          }
        }
      }
    } catch { /* yoksay */ }

    // Başarım kontrolü (bekletmeden, hatasız)
    try {
      const { checkAchievements } = await import("@/lib/achievements");
      await checkAchievements(db, session.userId);
    } catch { /* yoksay */ }

    // Yeni yorumu kullanıcı bilgileriyle döndür
    const [newComment] = await db
      .select({
        id: comments.id,
        content: comments.content,
        isSpoiler: comments.isSpoiler,
        isEdited: comments.isEdited,
        imageUrl: comments.imageUrl,
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

// PATCH: Yorumu düzenle (sadece sahibi)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();

    const ban = await getActiveBan(db, session.userId);
    if (ban) return NextResponse.json({ error: banMessage(ban) }, { status: 403 });

    const { id, content } = (await req.json()) as any;
    if (!id || !content?.trim()) return NextResponse.json({ error: "Yorum boş olamaz." }, { status: 400 });
    if (content.trim().length > 2000) return NextResponse.json({ error: "Yorum en fazla 2000 karakter." }, { status: 400 });

    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (!comment) return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
    if (comment.userId !== session.userId) return NextResponse.json({ error: "Sadece kendi yorumunu düzenleyebilirsin." }, { status: 403 });

    await db.update(comments).set({ content: maskProfanity(content.trim()), isEdited: true }).where(eq(comments.id, id));
    return NextResponse.json({ ok: true });
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
