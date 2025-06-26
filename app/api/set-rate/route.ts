import { NextResponse } from "next/server"
import { airtableService } from "@/lib/airtable-service"

export async function POST(request: Request) {
  try {
    const { rate } = await request.json()

    if (!rate || typeof rate !== "number" || rate <= 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid rate provided. Rate must be a positive number.",
      })
    }

    console.log(`🔧 Setting exchange rate to: ${rate}`)

    const success = await airtableService.setExchangeRate(rate)

    if (success) {
      return NextResponse.json({
        success: true,
        rate: rate,
        message: "Exchange rate updated successfully",
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to update exchange rate",
      })
    }
  } catch (error) {
    console.error("❌ Set rate error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to set rate",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
} 