import { NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import { settingsRepo } from "@/lib/db/settings-repo"

export async function POST(request: Request) {
  try {
    const { rate } = await request.json()

    if (!rate || typeof rate !== "number" || rate <= 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid rate provided. Rate must be a positive number.",
      })
    }

    console.log(`🔧 Setting single exchange rate to: ${rate}`)

    await runMigrations()
    await settingsRepo.setSingleRate(rate)

    return NextResponse.json({
      success: true,
      message: "Updated single rate",
      rate,
    })
  } catch (error) {
    console.error("❌ Set rate error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to set rate",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
} 