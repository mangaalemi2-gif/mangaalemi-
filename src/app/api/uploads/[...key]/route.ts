import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getBucket() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const env = getCloudflareContext()?.env as any;
    return env?.STORAGE ?? null;
  } catch {
    return null;
  }
}

// GET: /api/uploads/avatars/... veya /api/uploads/comments/...
export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const { key } = await params;
    const objectKey = (key || []).join("/");
    if (!objectKey || (!objectKey.startsWith("avatars/") && !objectKey.startsWith("comments/"))) {
      return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });
    }

    const bucket = getBucket();
    if (!bucket) return NextResponse.json({ error: "Depolama kullanılamıyor." }, { status: 500 });

    const obj = await bucket.get(objectKey);
    if (!obj) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });

    const headers = new Headers();
    headers.set("Content-Type", obj.httpMetadata?.contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new NextResponse(obj.body, { headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
