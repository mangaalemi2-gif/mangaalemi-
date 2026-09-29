import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|mangas|api|bakim|login|register).*)"],
};

export async function middleware(req: NextRequest) {
  try {
    const statusRes = await fetch(new URL("/api/site-status", req.url), {
      headers: { cookie: req.headers.get("cookie") || "" },
    });
    if (!statusRes.ok) return NextResponse.next();
    const { maintenance, isAdmin } = (await statusRes.json()) as any;
    if (maintenance && !isAdmin) {
      return NextResponse.rewrite(new URL("/bakim", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}
