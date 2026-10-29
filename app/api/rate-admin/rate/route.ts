import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { runMigrations } from "@/lib/db/migrate"
import { settingsRepo } from "@/lib/db/settings-repo"
import { getSessionCookieName, verifyAdminSessionToken } from "@/lib/rate-admin-session"
import { RATE_PENDING_MESSAGE } from "@/lib/exchange-rate"

function isAuthorized(request: NextRequest): boolean {
  const token = request.cookies.get(getSessionCookieName())?.value
  return verifyAdminSessionToken(token)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  await runMigrations()
  const { standard, small } = await settingsRepo.getDualRates()
  return NextResponse.json({
    success: true,
    rate: standard,
    smallRate: small,
  })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const numericRate = Number(body.rate)
    const numericSmall =
      body.smallRate === undefined || body.smallRate === "" ? numericRate : Number(body.smallRate)

    if (!Number.isFinite(numericRate) || numericRate < 0) {
      return NextResponse.json(
        { success: false, error: "Standard rate must be 0 or a positive number (e.g. 0.52)" },
        { status: 400 },
      )
    }
    if (!Number.isFinite(numericSmall) || numericSmall < 0) {
      return NextResponse.json(
        { success: false, error: "Small-trade rate must be 0 or a positive number (e.g. 0.50)" },
        { status: 400 },
      )
    }
    if (numericRate > 0 && numericSmall === 0) {
      return NextResponse.json(
        { success: false, error: "Set a small-trade rate, or enter 0 on both rates to pause trading" },
        { status: 400 },
      )
    }

    await runMigrations()
    await settingsRepo.setSingleRate(numericRate)
    await settingsRepo.setSmallRate(numericSmall)

    if (numericRate === 0) {
      return NextResponse.json({
        success: true,
        rate: 0,
        smallRate: numericSmall,
        status: "pending",
        tradingEnabled: false,
        message: RATE_PENDING_MESSAGE,
      })
    }

    return NextResponse.json({
      success: true,
      rate: numericRate,
      smallRate: numericSmall,
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
