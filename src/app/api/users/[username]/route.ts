import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, comments, commentLikes } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Herkese açık kullanıcı profili + istatistikler
export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const db = getDb();
    const decoded = decodeURIComponent(username);

    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        badge: users.badge,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.username, decoded));

    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

    const [{ count: commentCount }]: any = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(comments)
      .where(eq(comments.userId, user.id));

    const [{ count: likesReceived }]: any = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(commentLikes)
      .innerJoin(comments, eq(commentLikes.commentId, comments.id))
      .where(eq(comments.userId, user.id));

    // Son yorumlar (herkese açık)
    const recent = await db
      .select({
        id: comments.id,
        content: comments.content,
        context: comments.context,
        slug: comments.slug,
        chapter: comments.chapter,
        createdAt: comments.createdAt,
        likeCount: sql<number>`(SELECT COUNT(*) FROM comment_likes WHERE comment_id = ${comments.id})`,
      })
      .from(comments)
      .where(eq(comments.userId, user.id))
      .orderBy(sql`${comments.createdAt} DESC`)
      .limit(10);

    return NextResponse.json({ user, stats: { commentCount, likesReceived }, recent });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
