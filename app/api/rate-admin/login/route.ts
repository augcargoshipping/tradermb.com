import { NextRequest, NextResponse } from "next/server"
import { createAdminSessionToken, getSessionCookieName, validatePortalCredentials } from "@/lib/rate-admin-session"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    if (!validatePortalCredentials(username, password)) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    const token = createAdminSessionToken()
    const response = NextResponse.json({ success: true })
    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to authenticate", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
