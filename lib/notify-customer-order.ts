import { sendMail } from "@/lib/mail"
import { emailShell, escapeHtml } from "@/lib/email-format"
import { resolvePaymentSettings } from "@/lib/payment-settings"

export type CustomerOrderEmail = {
  referenceCode: string
  customerName: string
  email: string
  mobileNumber: string
  ghsAmount: number
  rmbAmount: number
}

/** Payment instructions emailed to the customer right after they submit the form. */
export async function notifyCustomerPaymentInstructions(order: CustomerOrderEmail): Promise<void> {
  if (!order.email?.trim()) return

  const payment = await resolvePaymentSettings()
  const ref = escapeHtml(order.referenceCode)
  const name = escapeHtml(order.customerName)

  const html = emailShell(
    "TRADE RMB — Complete your payment",
    `
      <p style="color: #374151; margin: 0 0 16px;">Hi ${name}, thank you for your order. Send mobile money using the details below.</p>
      <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #9a3412;"><strong>Send MoMo payment to</strong></p>
        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #ea580c; text-align: center;">${escapeHtml(payment.number)}</p>
        <p style="margin: 8px 0 0; text-align: center; color: #6b7280; font-size: 14px;">${escapeHtml(payment.name)} (MTN Mobile Money)</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
        <tr><td style="padding: 8px 0; color: #6b7280;">Reference code</td><td style="padding: 8px 0; font-weight: bold; font-family: monospace;">${ref}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Amount to pay</td><td style="padding: 8px 0; font-weight: bold; color: #dc2626;">GHS ${order.ghsAmount}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">You will receive</td><td style="padding: 8px 0; font-weight: bold; color: #2563eb;">¥${order.rmbAmount}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Pay from this number</td><td style="padding: 8px 0;">${escapeHtml(order.mobileNumber)}</td></tr>
      </table>
      <div style="background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 12px; font-size: 13px; color: #854d0e;">
        <strong>Important:</strong>
        <ul style="margin: 8px 0 0; padding-left: 18px;">
          <li>Use reference code <strong>${ref}</strong> in your payment note if possible</li>
          <li>Send exactly <strong>GHS ${order.ghsAmount}</strong></li>
          <li>Pay from the same MoMo number you entered: <strong>${escapeHtml(order.mobileNumber)}</strong></li>
          <li>Keep your payment receipt</li>
        </ul>
      </div>
      <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">After paying, open your order confirmation page and tick <strong>"I have sent the mobile money"</strong> so we can process your RMB faster.</p>
    `
  )

  const text = [
    `Hi ${order.customerName},`,
    "",
    "Thank you for your TRADE RMB order. Send mobile money to:",
    payment.number,
    payment.name,
    "",
    `Reference: ${order.referenceCode}`,
    `Pay: GHS ${order.ghsAmount}`,
    `Receive: RMB ${order.rmbAmount}`,
    `Pay from: ${order.mobileNumber}`,
    "",
    "After paying, confirm on your order page that you have sent the MoMo payment.",
  ].join("\n")

  try {
    await sendMail({
      to: order.email.trim(),
      subject: `Payment instructions — ${order.referenceCode} (GHS ${order.ghsAmount})`,
      text,
      html,
    })
    console.log("notify-customer-payment: sent to", order.email)
  } catch (error) {
    console.error("notify-customer-payment: failed:", error)
  }
}

/** Final email when admin marks the order Completed (RMB sent). */
export async function notifyCustomerRmbCompleted(order: CustomerOrderEmail): Promise<void> {
  if (!order.email?.trim()) return

  const name = escapeHtml(order.customerName)
  const ref = escapeHtml(order.referenceCode)

  const html = emailShell(
    "TRADE RMB — RMB sent successfully",
    `
      <p style="color: #374151; margin: 0 0 16px;">Hi ${name}, great news — your RMB transfer is complete.</p>
      <div style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #047857;">¥${order.rmbAmount} RMB has been sent</p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #065f46;">Check your Alipay wallet</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #6b7280;">Reference</td><td style="padding: 8px 0; font-family: monospace; font-weight: bold;">${ref}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">You paid</td><td style="padding: 8px 0;">GHS ${order.ghsAmount}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">You received</td><td style="padding: 8px 0; font-weight: bold;">¥${order.rmbAmount}</td></tr>
      </table>
      <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">Thank you for trading with TRADE RMB. Need help? Reply to this email or contact us on WhatsApp.</p>
    `
  )

  const text = [
    `Hi ${order.customerName},`,
    "",
    `Your RMB transfer is complete.`,
    `Reference: ${order.referenceCode}`,
    `Paid: GHS ${order.ghsAmount}`,
    `Received: RMB ${order.rmbAmount}`,
    "",
    "Check your Alipay wallet. Thank you for using TRADE RMB.",
  ].join("\n")

  try {
    await sendMail({
      to: order.email.trim(),
      subject: `RMB sent — ${order.referenceCode} (¥${order.rmbAmount})`,
      text,
      html,
    })
    console.log("notify-customer-rmb-complete: sent to", order.email)
  } catch (error) {
    console.error("notify-customer-rmb-complete: failed:", error)
  }
}
