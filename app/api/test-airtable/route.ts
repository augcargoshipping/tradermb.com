import { NextResponse } from "next/server"
import { airtableService } from "@/lib/airtable-service"

export async function GET() {
  try {
    console.log("🔍 Testing Airtable connection...")

    // Check environment variables
    const baseId = process.env.AIRTABLE_BASE_ID
    const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN

    const envCheck = {
      hasBaseId: !!baseId,
      hasToken: !!token,
      baseIdFormat: baseId?.startsWith("app") ? "✅ Valid" : "❌ Invalid (should start with 'app')",
      tokenFormat: token?.startsWith("pat") ? "✅ Valid" : "❌ Invalid (should start with 'pat')",
      baseIdLength: baseId?.length || 0,
      tokenLength: token?.length || 0,
    }

    console.log("🔧 Environment variables check:", envCheck)

    if (!baseId || !token) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        details: envCheck,
        instructions: "Please set AIRTABLE_BASE_ID and AIRTABLE_PERSONAL_ACCESS_TOKEN in your .env.local file",
      })
    }

    // Test connection
    const connectionResult = await airtableService.testConnection()

    if (connectionResult) {
      return NextResponse.json({
        success: true,
        message: "Successfully connected to Airtable",
        details: {
          baseId: `${baseId.substring(0, 8)}...`,
          tokenPrefix: `${token.substring(0, 8)}...`,
          tableName: "CUSTOMERS",
          environment: envCheck,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Failed to connect to Airtable",
        details: envCheck,
        troubleshooting: [
          "1. Verify your Base ID is correct",
          "2. Verify your Personal Access Token is correct",
          "3. Ensure your token has read/write permissions",
          "4. Check that the table name 'CUSTOMERS' exists in your base",
        ],
      })
    }
  } catch (error) {
    console.error("❌ Airtable test error:", error)
    return NextResponse.json({
      success: false,
      error: "Test failed with exception",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
