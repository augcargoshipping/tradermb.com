import { type NextRequest, NextResponse } from "next/server"
import { orderRepo } from "@/lib/db/order-repo"

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_ORDERS_KEY?.trim()
  if (!secret || secret.length < 8) return false
  const header = request.headers.get("x-admin-key")?.trim()
  if (!header) return false
  return header === secret
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 })
  }

  try {
    const qr_image_data_uri = await orderRepo.getOrderQrDataUri(id)
    if (!qr_image_data_uri) {
      return NextResponse.json({ error: "No QR image for this order" }, { status: 404 })
    }
    return NextResponse.json({ qr_image_data_uri })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: "Failed to load QR", details: message }, { status: 500 })
  }
}
