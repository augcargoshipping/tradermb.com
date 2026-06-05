import { NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import { resolvePaymentSettings } from "@/lib/payment-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate" }

export async function GET() {
  try {
    await runMigrations()
    const payment = await resolvePaymentSettings()
    return NextResponse.json({ success: true, ...payment }, { headers: noStore })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payment details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: noStore },
    )
  }
}
