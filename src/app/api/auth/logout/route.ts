import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;

    if (sessionId) {
      const env = (request as any).cf?.env || (globalThis as any).process?.env;
      const db = getDb(env);
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("session");
    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ success: true });
    response.cookies.delete("session");
    return response;
  }
}
