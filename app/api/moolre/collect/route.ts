import { NextRequest, NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import { orderRepo } from "@/lib/db/order-repo"
import { loadOrderForPayment } from "@/lib/moolre-fulfill"
import {
  MOOLRE_CHANNELS,
  type MoolreNetwork,
  moolreConfigured,
  moolreInitiatePayment,
} from "@/lib/moolre"
import { isMoolreCollectionEnabled } from "@/lib/payment-settings"
import { moolreCollectionFees } from "@/lib/moolre-fees"

const NETWORKS = new Set<MoolreNetwork>(["mtn", "telecel", "at"])

export async function POST(request: NextRequest) {
  try {
    if (!moolreConfigured()) {
      return NextResponse.json(
        { success: false, error: "Mobile money collection is not configured yet." },
        { status: 503 },
      )
    }

    let body: {
      recordId?: number
      referenceCode?: string
      network?: string
      otpcode?: string
      retry?: boolean
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
    }

    const recordId = typeof body.recordId === "number" ? body.recordId : Number(body.recordId)
    const referenceCode = String(body.referenceCode ?? "").trim()
    const network = String(body.network ?? "").trim().toLowerCase() as MoolreNetwork
    const otpcode = typeof body.otpcode === "string" ? body.otpcode.trim() : ""
    const retry = body.retry === true

    if (!Number.isFinite(recordId) || recordId < 1 || !referenceCode) {
      return NextResponse.json({ success: false, error: "Order reference and id are required" }, { status: 400 })
    }
    if (!NETWORKS.has(network)) {
      return NextResponse.json({ success: false, error: "Choose MTN, Telecel, or AT." }, { status: 400 })
    }

    await runMigrations()
    if (!(await isMoolreCollectionEnabled())) {
      return NextResponse.json(
        { success: false, error: "Instant MoMo collection is turned off. Send payment to the number on this page." },
        { status: 409 },
      )
    }
    const order = await loadOrderForPayment(recordId, referenceCode)
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }
    if (order.status === "Cancelled") {
      return NextResponse.json({ success: false, error: "This order was cancelled." }, { status: 409 })
    }
    if (order.status === "Paid" || order.status === "Completed" || order.moolre_status === "paid") {
      return NextResponse.json({ success: true, state: "paid", message: "Payment already received." })
    }

    const channel = MOOLRE_CHANNELS[network]
    const reuseExisting =
      !retry &&
      !otpcode &&
      order.moolre_status === "prompt_sent" &&
      order.moolre_external_ref &&
      order.moolre_channel === channel

    if (reuseExisting) {
      return NextResponse.json({
        success: true,
        state: "prompt_sent",
        message: "Approve the prompt on your phone.",
      })
    }

    let externalRef = order.moolre_external_ref || order.reference_code
    if (retry || (order.moolre_status === "failed" && !otpcode)) {
      externalRef = `${order.reference_code}-${Date.now()}`
    }

    const collectAmount = moolreCollectionFees(order.ghs_amount).collect

    let result = await moolreInitiatePayment({
      payer: order.mobile_number,
      amount: collectAmount,
      externalref: externalRef,
      channel,
      otpcode: otpcode || undefined,
    })

    if (result.kind === "error" && result.code === "TP13") {
      externalRef = `${order.reference_code}-${Date.now()}`
      result = await moolreInitiatePayment({
        payer: order.mobile_number,
        amount: collectAmount,
        externalref: externalRef,
        channel,
        otpcode: otpcode || undefined,
      })
    }

    if (result.kind === "otp_required") {
      await orderRepo.updateMoolreAttempt(order.id, {
        externalRef,
        channel,
        status: "otp_required",
      })
      return NextResponse.json({
        success: true,
        state: "otp_required",
        message: result.message || "Enter the OTP sent to your phone, then continue.",
      })
    }

    if (result.kind === "prompt_sent") {
      await orderRepo.updateMoolreAttempt(order.id, {
        externalRef,
        channel,
        status: "prompt_sent",
        transactionId: result.paymentId,
      })
      return NextResponse.json({
        success: true,
        state: "prompt_sent",
        message: result.message,
      })
    }

    await orderRepo.updateMoolreAttempt(order.id, {
      externalRef,
      channel,
      status: "failed",
    })
    return NextResponse.json({ success: false, state: "failed", error: result.message }, { status: 400 })
  } catch (error) {
    console.error("moolre/collect:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Could not start mobile money payment.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
