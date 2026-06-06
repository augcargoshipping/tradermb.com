import { DEFAULT_MOMO_PAYMENT_NUMBER, momoNumberToWhatsApp } from "@/lib/payment-settings"

/** Trade RMB support WhatsApp (0594669717). */
export const SUPPORT_WHATSAPP_WA = momoNumberToWhatsApp(DEFAULT_MOMO_PAYMENT_NUMBER)

export type SupportWhatsAppContext = {
  name?: string
  email?: string
  mobileNumber?: string
  referenceCode?: string
  ghsAmount?: string
  rmbAmount?: string
  reason?: string
}

export function buildSupportWhatsAppMessage(ctx: SupportWhatsAppContext = {}): string {
  const lines = ["Hello Trade RMB support!"]
  if (ctx.reason) lines.push("", ctx.reason)

  const details: string[] = []
  if (ctx.name) details.push(`Name: ${ctx.name}`)
  if (ctx.email) details.push(`Email: ${ctx.email}`)
  if (ctx.mobileNumber) details.push(`Phone: ${ctx.mobileNumber}`)
  if (ctx.referenceCode) details.push(`Reference: ${ctx.referenceCode}`)
  if (ctx.ghsAmount && ctx.rmbAmount) {
    details.push(`Amount: GHS ${ctx.ghsAmount} → RMB ${ctx.rmbAmount}`)
  }

  if (details.length > 0) {
    lines.push("", ...details)
  }

  return lines.join("\n")
}

export function buildWhatsAppUrl(
  message: string,
  waPhone: string = SUPPORT_WHATSAPP_WA,
): string {
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
}

export function buildSupportWhatsAppUrl(ctx: SupportWhatsAppContext = {}): string {
  return buildWhatsAppUrl(buildSupportWhatsAppMessage(ctx))
}

/** Default link for footer / floating button (no customer context yet). */
export const DEFAULT_SUPPORT_WHATSAPP_URL = buildSupportWhatsAppUrl({
  reason: "I need help with an exchange.",
})

export function supportWhatsAppUrlForUser(
  user?: { name?: string | null; email?: string | null } | null,
): string {
  if (!user?.name && !user?.email) return DEFAULT_SUPPORT_WHATSAPP_URL
  return buildSupportWhatsAppUrl({
    name: user.name || undefined,
    email: user.email || undefined,
    reason: "I need help with an exchange.",
  })
}

export function openSupportWhatsApp(ctx: SupportWhatsAppContext = {}): void {
  window.open(buildSupportWhatsAppUrl(ctx), "_blank", "noopener,noreferrer")
}
