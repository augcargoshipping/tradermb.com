import { NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import { resolveExchangeRate } from "@/lib/exchange-rate"

export const dynamic = "force-dynamic"
export const revalidate = 0

const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate" }

export async function GET() {
  try {
    await runMigrations()
    const state = await resolveExchangeRate()

    return NextResponse.json(
      {
        success: true,
        status: state.status,
        rate: state.storedRate,
        ghsPerRmb: state.ghsPerRmb,
        tradingEnabled: state.tradingEnabled,
        message: state.message,
        rates:
          state.status === "active"
            ? { standard: state.storedRate, lowRmb: state.storedRate }
            : { standard: null, lowRmb: null },
        type: "single",
        source: "turso",
      },
      { headers: noStore }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch rate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: noStore }
    )
  }
}
