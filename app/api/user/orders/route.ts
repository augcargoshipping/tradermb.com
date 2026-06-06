import { type NextRequest, NextResponse } from "next/server"
import { airtableService } from "@/lib/airtable-service"
import { runMigrations } from "@/lib/db/migrate"
import { orderRepo } from "@/lib/db/order-repo"
import { orderSummaryToDashboardOrder } from "@/lib/orders/dashboard-shape"
import { getAuthSession } from "@/lib/auth-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await getAuthSession()
  const emailParam = request.nextUrl.searchParams.get("email")
  const email = session?.user?.email ?? emailParam

  if (!email) {
    return NextResponse.json({ error: "Unauthorized or missing email" }, { status: 401 })
  }

  try {
    await runMigrations()

    const sessionUserId = session?.user?.userId ?? null
    let rows = await orderRepo.getOrdersByUserIdentifiersSummary({
      userId: sessionUserId,
      email,
    })

    if (rows.length === 0 && airtableService.isConfigured()) {
      const users = await airtableService.getUsersByEmail(email)
      if (users.length > 0) {
        const user = users[0].fields as Record<string, string | undefined>
        rows = await orderRepo.getOrdersByUserIdentifiersSummary({
          userId: user.User_ID || user.Username || sessionUserId,
          email: user.Email || email,
          mobileNumber: user.Phone || null,
          fullName: user.Full_Name || null,
        })
      }
    }

    const orders = rows.map(orderSummaryToDashboardOrder)
    return NextResponse.json({ orders })
  } catch (error) {
    console.error("user/orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
