import { NextResponse } from "next/server"
import { airtableService } from "@/lib/airtable-service"

export async function GET() {
  try {
    console.log("🔍 Fetching current exchange rate...")

    // Check environment variables
    const baseId = process.env.AIRTABLE_BASE_ID
    const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN

    if (!baseId || !token) {
      return NextResponse.json({
        success: false,
        error: "Missing Airtable credentials",
        rate: null,
      })
    }

    // Fetch the current rate
    const rate = await airtableService.fetchCurrentRate()

    if (rate !== null) {
      return NextResponse.json({
        success: true,
        rate: rate,
        message: "Rate fetched successfully",
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Rate not found in Airtable",
        rate: null,
        troubleshooting: [
          "1. Check if there's a 'Rate' field in your CUSTOMERS table",
          "2. Ensure at least one record has a Rate value",
          "3. Verify the Rate field is a number type in Airtable",
        ],
      })
    }
  } catch (error) {
    console.error("❌ Rate fetch error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch rate",
      rate: null,
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
} 