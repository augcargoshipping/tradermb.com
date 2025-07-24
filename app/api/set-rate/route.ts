import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { rate, type } = await request.json()

    if (!rate || typeof rate !== "number" || rate <= 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid rate provided. Rate must be a positive number.",
      })
    }

    if (!type || !["standard", "low rmb"].includes(type)) {
      return NextResponse.json({
        success: false,
        error: "Invalid rate type. Must be 'standard' or 'low rmb'.",
      })
    }

    console.log(`🔧 Setting ${type} exchange rate to: ${rate}`)

    // Since rates are now managed directly in the RATES table,
    // this API route should be updated to work with the new structure
    // For now, we'll return a message indicating the new approach
    return NextResponse.json({
      success: false,
      error: "Rate management has been moved to the dedicated RATES table. Please update rates directly in Airtable.",
      message: "Rates are now managed in the RATES table with 'type' and 'value' fields.",
      instructions: [
        "1. Go to your Airtable base",
        "2. Open the RATES table",
        "3. Update the 'value' field for the appropriate 'type' (standard or low rmb)",
        "4. Save the changes"
      ]
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