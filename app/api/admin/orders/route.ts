import { type NextRequest, NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import { orderRepo, type OrderStatus } from "@/lib/db/order-repo"
import { bytesToDataUri } from "@/lib/orders/blob"

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

function orderToAdminJson(o: Awaited<ReturnType<typeof orderRepo.listRecentOrders>>[number]) {
  let qr_image_data_uri: string | null = null
  if (o.qr_image && o.qr_image.length > 0) {
    qr_image_data_uri = bytesToDataUri(o.qr_image, o.qr_mime || "image/png")
  } else if (o.qr_data_uri) {
    qr_image_data_uri = o.qr_data_uri
  } else if (o.qr_url) {
    qr_image_data_uri = o.qr_url
  }

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
    qr_image_data_uri,
    has_qr: Boolean(qr_image_data_uri),
  }
}

/** Recent orders for ops (mobile-friendly when used with /admin/orders). */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse()
  }

  try {
    await runMigrations()
    const orders = await orderRepo.listRecentOrders(40)
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
    const ok = await orderRepo.updateOrderStatus(id, status)
    if (!ok) {
      return NextResponse.json({ error: "Order not found or not updated" }, { status: 404 })
    }
    return NextResponse.json({ success: true, id, status })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: "Failed to update status", details: message }, { status: 500 })
  }
}
