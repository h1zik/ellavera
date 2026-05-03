import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session-constants";
import { verifyAdminSessionTokenEdge } from "@/lib/admin-session-edge";

function isLoginPath(pathname: string) {
  return pathname === "/admin/login" || pathname.startsWith("/admin/login/");
}

function isLoginApi(pathname: string) {
  return pathname === "/api/admin/login" || pathname.startsWith("/api/admin/login/");
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (isLoginPath(pathname) || isLoginApi(pathname)) {
      const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
      if (isLoginPath(pathname) && token && (await verifyAdminSessionTokenEdge(token))) {
        const next = request.nextUrl.searchParams.get("next");
        const dest =
          next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
        return NextResponse.redirect(new URL(dest, request.url));
      }
      return NextResponse.next();
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const ok = await verifyAdminSessionTokenEdge(token);
    if (ok) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  } catch {
    const { pathname } = request.nextUrl;
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
