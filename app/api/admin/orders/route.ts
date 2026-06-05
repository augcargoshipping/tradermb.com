import { type NextRequest, NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import { orderRepo, type OrderStatus } from "@/lib/db/order-repo"
import { notifyCustomerRmbCompleted } from "@/lib/notify-customer-order"

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_ORDERS_KEY?.trim()
  if (!secret || secret.length < 8) return false
  const header = request.headers.get("x-admin-key")?.trim()
  if (!header) return false
  return header === secret
}

function unauthorizedResponse() {
  const key = process.env.ADMIN_ORDERS_KEY?.trim() ?? ""
  const configured = key.length >= 8
  return NextResponse.json(
    {
      error: "Unauthorized",
      hint: configured
        ? "Wrong admin key — use the exact ADMIN_ORDERS_KEY from .env.local (no spaces). Restart `npm run dev` after changing .env."
        : "Add ADMIN_ORDERS_KEY (8+ chars) to .env.local and restart the dev server.",
    },
    { status: 401 }
  )
}

function orderToAdminJson(o: Awaited<ReturnType<typeof orderRepo.listRecentOrdersSummary>>[number]) {
  return {
    id: o.id,
    customer_name: o.customer_name,
    email_address: o.email_address,
    mobile_number: o.mobile_number,
    referral_name: o.referral_name,
    ghs_amount: o.ghs_amount,
    rmb_amount: o.rmb_amount,
    reference_code: o.reference_code,
    status: o.status,
    submitted_at: o.submitted_at,
    has_qr: o.has_qr,
  }
}

/** Recent orders for ops (mobile-friendly when used with /admin/orders). */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse()
  }

  try {
    const orders = await orderRepo.listRecentOrdersSummary(40)
    return NextResponse.json({
      orders: orders.map(orderToAdminJson),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: "Failed to load orders", details: message }, { status: 500 })
  }
}

const ALLOWED_STATUS: OrderStatus[] = ["Pending", "Paid", "Completed", "Cancelled"]

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse()
  }

  let body: { id?: number; status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const id = typeof body.id === "number" ? body.id : Number(body.id)
  const status = body.status as OrderStatus
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 })
  }
  if (!status || !ALLOWED_STATUS.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status", allowed: ALLOWED_STATUS },
      { status: 400 }
    )
  }

  try {
    await runMigrations()
    const existing = await orderRepo.getOrderById(id)
    if (!existing) {
      return NextResponse.json({ error: "Order not found or not updated" }, { status: 404 })
    }

    const ok = await orderRepo.updateOrderStatus(id, status)
    if (!ok) {
      return NextResponse.json({ error: "Order not found or not updated" }, { status: 404 })
    }

    if (status === "Completed" && existing.status !== "Completed") {
      await notifyCustomerRmbCompleted({
        referenceCode: existing.reference_code,
        customerName: existing.customer_name,
        email: existing.email_address,
        mobileNumber: existing.mobile_number,
        ghsAmount: existing.ghs_amount,
        rmbAmount: existing.rmb_amount,
      })
    }

    return NextResponse.json({ success: true, id, status })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: "Failed to update status", details: message }, { status: 500 })
  }
}
