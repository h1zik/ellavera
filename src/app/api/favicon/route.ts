import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Proxy favicon dari `SiteSettings.faviconUrl` agar `/favicon.ico` (default browser)
 * tidak jatuh ke favicon bawaan platform (mis. Vercel).
 */
export async function GET() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { faviconUrl: true },
  });
  const url = settings?.faviconUrl?.trim();
  if (!url) {
    return new NextResponse(null, { status: 404 });
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(url);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (upstreamUrl.protocol !== "https:" && upstreamUrl.protocol !== "http:") {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      cache: "no-store",
      headers: { Accept: "image/*,*/*" },
    });
    if (!upstream.ok) {
      return new NextResponse(null, { status: 502 });
    }
    const buf = new Uint8Array(await upstream.arrayBuffer());
    const type =
      upstream.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
