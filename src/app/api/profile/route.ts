import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, comments, commentLikes, polls, pollVotes, supportTickets, reports } from "@/lib/db/schema";
import { getSession, verifyPassword, hashPassword } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

// GET: Kendi profil özetim + istatistikler
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();

    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (!me) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

    const [{ count: commentCount }]: any = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(comments)
      .where(eq(comments.userId, session.userId));

    const [{ count: likesReceived }]: any = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(commentLikes)
      .innerJoin(comments, eq(commentLikes.commentId, comments.id))
      .where(eq(comments.userId, session.userId));

    const [{ count: likesGiven }]: any = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(commentLikes)
      .where(eq(commentLikes.userId, session.userId));

    const [{ count: pollCount }]: any = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(polls)
      .where(eq(polls.userId, session.userId));

    const [{ count: votesGiven }]: any = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(pollVotes)
      .where(eq(pollVotes.userId, session.userId));

    const [{ count: ticketCount }]: any = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(supportTickets)
      .where(eq(supportTickets.userId, session.userId));

    return NextResponse.json({
      user: {
        id: me.id,
        username: me.username,
        email: me.email,
        role: me.role,
        avatarUrl: me.avatarUrl,
        bio: (me as any).bio ?? null,
        badge: me.badge,
        createdAt: me.createdAt,
      },
      stats: { commentCount, likesReceived, likesGiven, pollCount, votesGiven, ticketCount },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH: Profil güncelle (bio, avatarUrl, username, şifre)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();

    const body = (await req.json()) as any;
    const { bio, avatarUrl, username, currentPassword, newPassword } = body;

    const [me] = await db.select().from(users).where(eq(users.id, session.userId));
    if (!me) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

    const update: any = {};

    if (bio !== undefined) {
      if (bio && bio.length > 500) return NextResponse.json({ error: "Biyografi en fazla 500 karakter." }, { status: 400 });
      update.bio = bio?.trim() || null;
    }
    if (avatarUrl !== undefined) {
      if (avatarUrl && avatarUrl.length > 500) return NextResponse.json({ error: "Avatar URL çok uzun." }, { status: 400 });
      if (avatarUrl && !/^https?:\/\/.+/.test(avatarUrl)) return NextResponse.json({ error: "Avatar geçerli bir URL olmalı (https://...)." }, { status: 400 });
      update.avatarUrl = avatarUrl?.trim() || null;
    }
    if (username !== undefined && username !== me.username) {
      const clean = username.trim();
      if (clean.length < 3) return NextResponse.json({ error: "Kullanıcı adı en az 3 karakter." }, { status: 400 });
      if (clean.length > 30) return NextResponse.json({ error: "Kullanıcı adı en fazla 30 karakter." }, { status: 400 });
      if (!/^[a-zA-Z0-9_çÇğĞıİöÖşŞüÜ]+$/.test(clean)) return NextResponse.json({ error: "Kullanıcı adı harf, rakam ve _ içerebilir." }, { status: 400 });
      const [existing] = await db.select().from(users).where(eq(users.username, clean));
      if (existing) return NextResponse.json({ error: "Bu kullanıcı adı alınmış." }, { status: 409 });
      update.username = clean;
    }

    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: "Mevcut şifreni girmelisin." }, { status: 400 });
      if (!me.passwordHash) return NextResponse.json({ error: "Bu hesapta şifre değişimi desteklenmiyor." }, { status: 400 });
      const ok = await verifyPassword(currentPassword, me.passwordHash);
      if (!ok) return NextResponse.json({ error: "Mevcut şifre yanlış." }, { status: 400 });
      if (newPassword.length < 6) return NextResponse.json({ error: "Yeni şifre en az 6 karakter." }, { status: 400 });
      update.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(update).length === 0) return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });

    await db.update(users).set(update).where(eq(users.id, session.userId));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
