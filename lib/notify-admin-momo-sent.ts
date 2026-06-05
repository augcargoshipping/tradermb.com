import { sendMail } from "@/lib/mail"
import { emailShell, escapeHtml, siteBaseUrl } from "@/lib/email-format"

export type MomoConfirmedNotification = {
  referenceCode: string
  customerName: string
  email: string
  mobileNumber: string
  ghsAmount: number
  rmbAmount: number
}

/** Admin alert when a customer ticks "I have sent mobile money" on the confirmation page. */
export async function notifyAdminMomoSent(order: MomoConfirmedNotification): Promise<void> {
  const to = process.env.ADMIN_NOTIFY_EMAIL?.trim()
  if (!to) {
    console.log("notify-admin-momo-sent: ADMIN_NOTIFY_EMAIL not set, skipping")
    return
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log("notify-admin-momo-sent: EMAIL_USER/PASSWORD not set, skipping")
    return
  }

  const adminUrl = `${siteBaseUrl()}/admin/orders`
  const ref = escapeHtml(order.referenceCode)

  const html = emailShell(
    "TRADE RMB — Customer sent MoMo",
    `
      <p style="color: #374151; margin: 0 0 16px;">A customer has confirmed they sent their mobile money payment. Please verify and process their RMB transfer.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #6b7280;">Reference</td><td style="padding: 8px 0; font-weight: bold; font-family: monospace;">${ref}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Customer</td><td style="padding: 8px 0;">${escapeHtml(order.customerName)}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Phone</td><td style="padding: 8px 0;"><a href="tel:${escapeHtml(order.mobileNumber)}">${escapeHtml(order.mobileNumber)}</a></td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;">${escapeHtml(order.email)}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Amount</td><td style="padding: 8px 0;">₵${order.ghsAmount} → ¥${order.rmbAmount}</td></tr>
      </table>
      <div style="text-align: center; margin: 28px 0 8px;">
        <a href="${adminUrl}"
           style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
                  color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Open admin orders
        </a>
      </div>
    `
  )

  const text = [
    "Customer confirmed MoMo payment",
    `Ref: ${order.referenceCode}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.mobileNumber}`,
    `Email: ${order.email}`,
    `Amount: GHS ${order.ghsAmount} → RMB ${order.rmbAmount}`,
    `Admin: ${adminUrl}`,
  ].join("\n")

  try {
    await sendMail({
      to,
      subject: `MoMo sent — ${order.referenceCode} — verify payment`,
      text,
      html,
    })
    console.log("notify-admin-momo-sent: sent to", to)
  } catch (error) {
    console.error("notify-admin-momo-sent: failed:", error)
  }
}
