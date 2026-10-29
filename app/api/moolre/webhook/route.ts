import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { runMigrations } from "@/lib/db/migrate"
import { orderRepo } from "@/lib/db/order-repo"
import { fulfillMoolrePaid } from "@/lib/moolre-fulfill"
import { getMoolreConfig } from "@/lib/moolre"

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  try {
    const { webhookSecret, accountNumber } = getMoolreConfig()
    if (!webhookSecret) {
      console.error("moolre/webhook: MOOLRE_WEBHOOK_SECRET is not set")
      return NextResponse.json({ success: false }, { status: 503 })
    }

    let body: {
      status?: number | string
      code?: string
      message?: string
      data?: Record<string, unknown>
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    const data = body.data && typeof body.data === "object" ? body.data : {}
    const providedSecret = typeof data.secret === "string" ? data.secret : ""
    if (!providedSecret || !secretsMatch(providedSecret, webhookSecret)) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    const code = String(body.code ?? "").toUpperCase()
    const txstatus = Number(data.txstatus)
    const externalRef = String(data.externalref ?? "").trim()
    if (!externalRef) {
      return NextResponse.json({ success: true })
    }

    await runMigrations()
    const refMatch = externalRef.match(/^(TR-\d+)/)
    const order =
      (await orderRepo.getOrderByMoolreExternalRef(externalRef)) ??
      (await orderRepo.getOrderByReferenceCode(externalRef)) ??
      (refMatch ? await orderRepo.getOrderByReferenceCode(refMatch[1]) : null)

    if (!order) {
      console.error("moolre/webhook: unknown externalref")
      return NextResponse.json({ success: true })
    }

    const destAccount = String(data.accountnumber ?? "").trim()
    if (accountNumber && destAccount && destAccount !== accountNumber) {
      console.error("moolre/webhook: account mismatch")
      return NextResponse.json({ success: false }, { status: 401 })
    }

    if (code === "P01" && (body.status === 1 || body.status === "1") && txstatus === 1) {
      const amount = Number.parseFloat(String(data.amount ?? data.value ?? ""))
      const paid = await fulfillMoolrePaid(order, {
        externalRef,
        transactionId: data.transactionid != null ? String(data.transactionid) : null,
        amount: Number.isFinite(amount) ? amount : null,
      })
      if (!paid.ok) {
        return NextResponse.json({ success: false, error: paid.error }, { status: 409 })
      }
      return NextResponse.json({ success: true })
    }

    if (code === "P02" || txstatus === 2) {
      if (order.status === "Pending") {
        await orderRepo.updateMoolreAttempt(order.id, {
          externalRef,
          status: "failed",
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("moolre/webhook:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
