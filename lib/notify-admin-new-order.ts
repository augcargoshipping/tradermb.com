import { sendMail } from "@/lib/mail"

export type NewOrderNotification = {
  referenceCode: string
  customerName: string
  email: string
  mobileNumber: string
  ghsAmount: number
  rmbAmount: number
  referralName?: string
  hasQr: boolean
}

function siteBaseUrl(): string {
  const url = process.env.NEXTAUTH_URL?.trim() || process.env.VERCEL_URL
  if (!url) return "http://localhost:3000"
  if (url.startsWith("http")) return url.replace(/\/$/, "")
  return `https://${url.replace(/\/$/, "")}`
}

/** Email ops when a purchase form is submitted. Never throws — logs on failure. */
export async function notifyAdminNewOrder(order: NewOrderNotification): Promise<void> {
  const to = process.env.ADMIN_NOTIFY_EMAIL?.trim()
  if (!to) {
    console.log("notify-admin-new-order: ADMIN_NOTIFY_EMAIL not set, skipping")
    return
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log("notify-admin-new-order: EMAIL_USER/PASSWORD not set, skipping")
    return
  }

  const adminUrl = `${siteBaseUrl()}/admin/orders`
  const submittedAt = new Date().toLocaleString("en-GB", { timeZone: "Africa/Accra" })

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">TRADE RMB — New order</h1>
      </div>
      <div style="padding: 24px; background: #f9fafb;">
        <p style="color: #374151; margin: 0 0 16px;">A customer just submitted the purchase form.</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #6b7280;">Reference</td><td style="padding: 8px 0; font-weight: bold; font-family: monospace;">${order.referenceCode}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Customer</td><td style="padding: 8px 0;">${order.customerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Phone</td><td style="padding: 8px 0;"><a href="tel:${order.mobileNumber}">${order.mobileNumber}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;">${order.email}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Amount</td><td style="padding: 8px 0;">₵${order.ghsAmount} → ¥${order.rmbAmount}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Alipay QR</td><td style="padding: 8px 0;">${order.hasQr ? "Attached" : "Not provided"}</td></tr>
          ${order.referralName ? `<tr><td style="padding: 8px 0; color: #6b7280;">Referral</td><td style="padding: 8px 0;">${order.referralName}</td></tr>` : ""}
          <tr><td style="padding: 8px 0; color: #6b7280;">Submitted</td><td style="padding: 8px 0;">${submittedAt} (Ghana)</td></tr>
        </table>
        <div style="text-align: center; margin: 28px 0 8px;">
          <a href="${adminUrl}"
             style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
                    color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Open admin orders
          </a>
        </div>
      </div>
    </div>
  `

  const text = [
    "New TRADE RMB order",
    `Ref: ${order.referenceCode}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.mobileNumber}`,
    `Email: ${order.email}`,
    `Amount: GHS ${order.ghsAmount} → RMB ${order.rmbAmount}`,
    `QR: ${order.hasQr ? "yes" : "no"}`,
    order.referralName ? `Referral: ${order.referralName}` : "",
    `Admin: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const sent = await sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `New order ${order.referenceCode} — ₵${order.ghsAmount} / ¥${order.rmbAmount}`,
      text,
      html,
    })
    if (sent) {
      console.log("notify-admin-new-order: sent to", to)
    }
  } catch (error) {
    console.error("notify-admin-new-order: failed:", error)
  }
}
