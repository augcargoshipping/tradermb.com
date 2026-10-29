import { NextRequest, NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import { orderRepo } from "@/lib/db/order-repo"
import { fulfillMoolrePaid, loadOrderForPayment } from "@/lib/moolre-fulfill"
import { moolreConfigured, moolrePaymentStatus } from "@/lib/moolre"

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
      return NextResponse.json({ success: false, error: "Order reference and id are required" }, { status: 400 })
    }

    await runMigrations()
    const order = await loadOrderForPayment(recordId, referenceCode)
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    if (order.status === "Paid" || order.status === "Completed" || order.moolre_status === "paid") {
      return NextResponse.json({ success: true, state: "paid" })
    }
    if (order.status === "Cancelled") {
      return NextResponse.json({ success: true, state: "cancelled" })
    }
    if (!order.moolre_external_ref) {
      return NextResponse.json({ success: true, state: order.moolre_status || "idle" })
    }
    if (!moolreConfigured()) {
      return NextResponse.json({ success: true, state: order.moolre_status || "idle" })
    }

    const status = await moolrePaymentStatus(order.moolre_external_ref)
    if (status.txstatus === 1) {
      const paid = await fulfillMoolrePaid(order, {
        externalRef: status.externalref || order.moolre_external_ref,
        transactionId: status.transactionId,
        amount: status.amount,
      })
      if (!paid.ok) {
        return NextResponse.json({ success: false, state: "failed", error: paid.error }, { status: 409 })
      }
      return NextResponse.json({ success: true, state: "paid" })
    }
    if (status.txstatus === 2) {
      await orderRepo.updateMoolreAttempt(order.id, {
        externalRef: order.moolre_external_ref,
        status: "failed",
      })
      return NextResponse.json({
        success: true,
        state: "failed",
        error: status.message || "Payment was declined or timed out.",
      })
    }

    return NextResponse.json({
      success: true,
      state: order.moolre_status === "otp_required" ? "otp_required" : "prompt_sent",
    })
  } catch (error) {
    console.error("moolre/status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Could not check payment status.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
