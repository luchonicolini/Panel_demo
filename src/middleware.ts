import { NextResponse, type NextRequest } from "next/server";
import { getRuntimeConfigError, isDemoMode } from "@/lib/env";
import { DEMO_COOKIE, verifyDemoSessionToken } from "@/lib/demo-session";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const configError = getRuntimeConfigError();

  if (configError) {
    return new NextResponse(`Configuración inválida: ${configError}`, {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (isDemoMode()) {
    const email = await verifyDemoSessionToken(request.cookies.get(DEMO_COOKIE)?.value);

    if (!email && path.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    if (email && path === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/productos";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
