import { NextRequest, NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import {
  normalizeMomoNumber,
  normalizePaymentName,
  resolvePaymentSettings,
  savePaymentSettings,
} from "@/lib/payment-settings"
import { getSessionCookieName, verifyAdminSessionToken } from "@/lib/rate-admin-session"

export const dynamic = "force-dynamic"

function isAuthorized(request: NextRequest): boolean {
  const token = request.cookies.get(getSessionCookieName())?.value
  return verifyAdminSessionToken(token)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  await runMigrations()
  const payment = await resolvePaymentSettings()
  return NextResponse.json({ success: true, ...payment })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const number = normalizeMomoNumber(String(body.number ?? ""))
    const name = normalizePaymentName(String(body.name ?? ""))

    if (!number) {
      return NextResponse.json(
        { success: false, error: "Enter a valid mobile money number (e.g. 0594669717)" },
        { status: 400 },
      )
    }
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Enter the account name shown to customers" },
        { status: 400 },
      )
    }

    await runMigrations()
    await savePaymentSettings(number, name)

    return NextResponse.json({ success: true, number, name })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update payment details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
