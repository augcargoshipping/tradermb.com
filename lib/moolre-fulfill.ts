import { amountsMatch } from "@/lib/moolre"
import { moolreCollectionFees } from "@/lib/moolre-fees"
import { orderRepo, type OrderRecord } from "@/lib/db/order-repo"
import { notifyAdminMomoSent } from "@/lib/notify-admin-momo-sent"

export async function fulfillMoolrePaid(
  order: OrderRecord,
  input: { externalRef: string; transactionId?: string | null; amount?: number | null },
): Promise<{ ok: true; newlyPaid: boolean; order: OrderRecord } | { ok: false; error: string }> {
  const expectedCollect = moolreCollectionFees(order.ghs_amount).collect
  if (
    input.amount != null &&
    !amountsMatch(expectedCollect, input.amount) &&
    !amountsMatch(order.ghs_amount, input.amount)
  ) {
    console.error("moolre amount mismatch", {
      ref: order.reference_code,
      expected: expectedCollect,
      trade: order.ghs_amount,
      reported: input.amount,
    })
    return { ok: false, error: "Paid amount does not match this order." }
  }

  const result = await orderRepo.markOrderPaidFromMoolre(order, {
    externalRef: input.externalRef,
    transactionId: input.transactionId,
  })

  if (result.newlyPaid) {
    await notifyAdminMomoSent({
      referenceCode: result.order.reference_code,
      customerName: result.order.customer_name,
      email: result.order.email_address,
      mobileNumber: result.order.mobile_number,
      ghsAmount: result.order.ghs_amount,
      rmbAmount: result.order.rmb_amount,
    })
  }

  return { ok: true, newlyPaid: result.newlyPaid, order: result.order }
}

export async function loadOrderForPayment(recordId: number, referenceCode: string): Promise<OrderRecord | null> {
  const order = await orderRepo.getOrderById(recordId)
  if (!order || order.reference_code !== referenceCode) return null
  return order
}
