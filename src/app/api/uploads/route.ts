import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const ALLOWED: Record<string, string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp"],
  comment: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};

const MAX_SIZE: Record<string, number> = {
  avatar: 2 * 1024 * 1024,
  comment: 5 * 1024 * 1024,
};

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

// POST: Dosya yükle (FormData: file, kind=avatar|comment)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

    const bucket = getBucket();
    if (!bucket) return NextResponse.json({ error: "Depolama şu an kullanılamıyor." }, { status: 500 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const kind = String(form.get("kind") || "comment");
    if (!file || !(kind in ALLOWED)) return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 });
    if (!ALLOWED[kind].includes(file.type)) {
      return NextResponse.json({ error: "Desteklenmeyen dosya türü (jpg/png/webp" + (kind === "comment" ? "/gif" : "") + ")." }, { status: 400 });
    }
    if (file.size > MAX_SIZE[kind]) {
      return NextResponse.json({ error: `Dosya çok büyük (max ${MAX_SIZE[kind] / 1024 / 1024}MB).` }, { status: 400 });
    }

    const ext = file.type.split("/")[1] || "png";
    const key = `${kind}s/${session.userId}-${randomUUID()}.${ext}`;
    const buf = await file.arrayBuffer();
    await bucket.put(key, buf, { httpMetadata: { contentType: file.type } });

    return NextResponse.json({ url: `/api/uploads/${key}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
