import { NextRequest, NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import { orderRepo } from "@/lib/db/order-repo"
import { notifyAdminMomoSent } from "@/lib/notify-admin-momo-sent"

export async function POST(request: NextRequest) {
  try {
    let body: { recordId?: number; referenceCode?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
    }

    const recordId = typeof body.recordId === "number" ? body.recordId : Number(body.recordId)
    const referenceCode = String(body.referenceCode ?? "").trim()

    if (!Number.isFinite(recordId) || recordId < 1 || !referenceCode) {
      return NextResponse.json(
        { success: false, error: "Order reference and id are required" },
        { status: 400 },
      )
    }

    await runMigrations()
    const result = await orderRepo.confirmMomoPayment(recordId, referenceCode)
    if (!result) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    if (result.newlyConfirmed) {
      await notifyAdminMomoSent({
        referenceCode: result.order.reference_code,
        customerName: result.order.customer_name,
        email: result.order.email_address,
        mobileNumber: result.order.mobile_number,
        ghsAmount: result.order.ghs_amount,
        rmbAmount: result.order.rmb_amount,
      })
    }

    return NextResponse.json({
      success: true,
      alreadyConfirmed: !result.newlyConfirmed,
      status: result.order.status,
    })
  } catch (error) {
    console.error("confirm-momo:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to confirm payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
