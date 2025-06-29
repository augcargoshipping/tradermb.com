import { NextResponse } from "next/server"
import { airtableService } from "@/lib/airtable-service"

export async function GET() {
  try {
    console.log("🔍 Fetching current exchange rate...")

    // Check environment variables
    const baseId = process.env.AIRTABLE_BASE_ID
    const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN

    if (!baseId || !token) {
      console.log("❌ Missing Airtable credentials")
      return NextResponse.json({
        success: false,
        error: "Airtable credentials not configured",
        message: "Please configure AIRTABLE_BASE_ID and AIRTABLE_PERSONAL_ACCESS_TOKEN"
      }, { status: 500 })
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
      console.log("❌ No rate found in Airtable")
      return NextResponse.json({
        success: false,
        error: "No rate found in Airtable",
        message: "No exchange rate found in the database",
        troubleshooting: [
          "1. Check if there's a 'Rate' field in your CUSTOMERS table",
          "2. Ensure at least one record has a Rate value",
          "3. Verify the Rate field is a number type in Airtable",
          "4. Use the /api/set-rate endpoint to set a rate",
        ],
      }, { status: 404 })
    }
  } catch (error) {
    console.error("❌ Rate fetch error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch rate",
      message: "An error occurred while fetching the exchange rate",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
} 