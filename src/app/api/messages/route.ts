import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { conversations, messages, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { maskProfanity } from "@/lib/profanity";
import { eq, and, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// GET: ?list=1 → konuşmalarım | ?with=userId → mesajlar (okundu işaretler) | ?unread=1 → okunmamış sayısı
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { searchParams } = new URL(req.url);

    if (searchParams.get("unread") === "1") {
      const [c] = (await db
        .select({ n: sql<number>`COUNT(*)` })
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            eq(messages.isRead, false),
            or(eq(conversations.userA, session.userId), eq(conversations.userB, session.userId)),
            sql`${messages.senderId} != ${session.userId}`
          )
        )) as any;
      return NextResponse.json({ unread: Number((c as any)?.n ?? 0) });
    }

    if (searchParams.get("list") === "1") {
      const convs = await db
        .select()
        .from(conversations)
        .where(or(eq(conversations.userA, session.userId), eq(conversations.userB, session.userId)))
        .orderBy(sql`${conversations.lastMessageAt} DESC`)
        .limit(50);

      const withUsers = await Promise.all(
        convs.map(async (c) => {
          const otherId = c.userA === session.userId ? c.userB : c.userA;
          const [other] = await db
            .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
            .from(users)
            .where(eq(users.id, otherId));
          const [last] = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, c.id))
            .orderBy(sql`${messages.createdAt} DESC`)
            .limit(1);
          const [u] = (await db
            .select({ n: sql<number>`COUNT(*)` })
            .from(messages)
            .where(
              and(eq(messages.conversationId, c.id), eq(messages.isRead, false), sql`${messages.senderId} != ${session.userId}`)
            )) as any;
          return { ...c, other, lastMessage: last || null, unread: Number((u as any)?.n ?? 0) };
        })
      );
      return NextResponse.json({ conversations: withUsers });
    }

    const withUser = searchParams.get("with");
    if (!withUser) return NextResponse.json({ error: "with gerekli." }, { status: 400 });
    const [a, b] = pair(session.userId, withUser);
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userA, a), eq(conversations.userB, b)));
    if (!conv) return NextResponse.json({ messages: [] });

    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(sql`${messages.createdAt} ASC`)
      .limit(200);

    // Karşıdan gelenleri okundu işaretle
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(eq(messages.conversationId, conv.id), eq(messages.isRead, false), sql`${messages.senderId} != ${session.userId}`)
      );

    return NextResponse.json({ messages: rows, conversationId: conv.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Mesaj gönder {toUserId, content}
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const db = getDb();
    const { toUserId, content } = (await req.json()) as any;
    if (!toUserId || !content?.trim()) return NextResponse.json({ error: "Alıcı ve mesaj gerekli." }, { status: 400 });
    if (content.trim().length > 2000) return NextResponse.json({ error: "Mesaj en fazla 2000 karakter." }, { status: 400 });
    if (toUserId === session.userId) return NextResponse.json({ error: "Kendine mesaj gönderemezsin." }, { status: 400 });

    const [target] = await db.select().from(users).where(eq(users.id, toUserId));
    if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });

    const [a, b] = pair(session.userId, toUserId);
    let [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userA, a), eq(conversations.userB, b)));
    if (!conv) {
      const id = randomUUID();
      await db.insert(conversations).values({ id, userA: a, userB: b });
      [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    }

    const mid = randomUUID();
    await db.insert(messages).values({
      id: mid,
      conversationId: conv.id,
      senderId: session.userId,
      content: maskProfanity(content.trim()),
    });
    await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id));

    const { bumpActivity } = await import("@/lib/streaks");
    try {
      await bumpActivity(db, session.userId, { messages: 1 });
    } catch { /* yoksay */ }

    return NextResponse.json({ id: mid, conversationId: conv.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
