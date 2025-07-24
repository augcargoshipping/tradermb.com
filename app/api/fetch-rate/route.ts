import { NextResponse } from "next/server"
import { airtableService } from "@/lib/airtable-service"

export async function GET(request: Request) {
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

    // Get query parameters for dynamic rate calculation
    const { searchParams } = new URL(request.url)
    const rmbAmount = searchParams.get('rmbAmount')

    if (rmbAmount) {
      // Dynamic rate calculation based on RMB amount
      const amount = parseFloat(rmbAmount)
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({
          success: false,
          error: "Invalid RMB amount",
          message: "Please provide a valid positive RMB amount"
        }, { status: 400 })
      }

      console.log(`🔍 Getting rate for RMB amount: ${amount}`)
      const rateResult = await airtableService.getRateForAmount(amount)
      
      if (rateResult.rate !== null) {
        console.log(`✅ Rate found: ${rateResult.rate} (${rateResult.type})`)
        return NextResponse.json({
          success: true,
          rate: rateResult.rate,
          type: rateResult.type,
          rmbAmount: amount,
          message: `Rate fetched successfully for ¥${amount}`,
        })
      } else {
        console.log("❌ No rate found for amount")
        return NextResponse.json({
          success: false,
          error: "No rate found for amount",
          message: "No exchange rate found for the specified amount",
        }, { status: 404 })
      }
    } else {
      // Fetch all rates for display
      console.log("🔍 Fetching all rates from RATES table...")
      const rates = await airtableService.fetchAllRates()
      
      console.log(`📊 Rates found:`, rates)
      
      if (rates.standard !== null || rates.lowRmb !== null) {
        console.log("✅ Using rates from RATES table")
        return NextResponse.json({
          success: true,
          rates: rates,
          message: "All rates fetched successfully",
        })
      } else {
        console.log("⚠️ No rates found in RATES table, falling back to CUSTOMERS table")
        // Fallback to old method
        const rate = await airtableService.fetchCurrentRate()
        
        if (rate !== null) {
          console.log(`✅ Using fallback rate: ${rate}`)
          return NextResponse.json({
            success: true,
            rate: rate,
            message: "Rate fetched successfully (fallback)",
          })
        } else {
          console.log("❌ No rate found in any table")
          return NextResponse.json({
            success: false,
            error: "No rate found in Airtable",
            message: "No exchange rate found in the database",
            troubleshooting: [
              "1. Check if there's a RATES table in your Airtable base",
              "2. Ensure the RATES table has 'A type' and '# value' fields",
              "3. Add records with 'standard' and 'low rmb' types",
              "4. Verify the '# value' field contains numbers",
            ],
          }, { status: 404 })
        }
      }
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