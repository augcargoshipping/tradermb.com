import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    airtable: {
      baseId: process.env.AIRTABLE_BASE_ID ? "✓ SET" : "✗ NOT SET",
      token: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN ? "✓ SET" : "✗ NOT SET",
    },
    turso: {
      databaseUrl: process.env.TURSO_DATABASE_URL ? "✓ SET" : "✗ NOT SET",
      authToken: process.env.TURSO_AUTH_TOKEN ? "✓ SET" : "✗ NOT SET",
    },
    adminOrders: {
      adminOrdersKey: process.env.ADMIN_ORDERS_KEY && process.env.ADMIN_ORDERS_KEY.length >= 8 ? "✓ SET" : "✗ NOT SET",
    },
    fileCheck: {
      envLocalExists: "Check manually - file should be in project root",
      envLocalFormat: "Should be: KEY=value (no spaces around =)",
    },
  })
} 