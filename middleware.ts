import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isSiteClosed } from "@/lib/site-status"

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    /\.(png|jpe?g|svg|ico|webp|woff2?|txt|xml)$/i.test(pathname)
  )
}

export function middleware(request: NextRequest) {
  if (!isSiteClosed()) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  if (isStaticAsset(pathname) || pathname === "/site-closed") {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json(
      { error: "Trade RMB is temporarily closed. Please check back later." },
      { status: 503 },
    )
  }

  if (pathname !== "/site-closed") {
    const url = request.nextUrl.clone()
    url.pathname = "/site-closed"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
