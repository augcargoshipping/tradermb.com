import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { runMigrations } from "@/lib/db/migrate"
import { settingsRepo } from "@/lib/db/settings-repo"
import { getSessionCookieName, verifyAdminSessionToken } from "@/lib/rate-admin-session"

function isAuthorized(request: NextRequest): boolean {
  const token = request.cookies.get(getSessionCookieName())?.value
  return verifyAdminSessionToken(token)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  await runMigrations()
  const rate = await settingsRepo.getSingleRate()
  return NextResponse.json({ success: true, rate })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { rate } = await request.json()
    const numericRate = Number(rate)
    if (!Number.isFinite(numericRate) || numericRate < 0) {
      return NextResponse.json({ success: false, error: "Rate must be 0 or a positive number" }, { status: 400 })
    }

    await runMigrations()
    await settingsRepo.setSingleRate(numericRate)

    if (numericRate === 0) {
      return NextResponse.json({
        success: true,
        rate: 0,
        status: "pending",
        tradingEnabled: false,
        message: "Rate will be posted soon — trading paused",
      })
    }

    return NextResponse.json({
      success: true,
      rate: numericRate,
      status: "active",
      tradingEnabled: true,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update rate", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
