import { settingsRepo } from "@/lib/db/settings-repo"

export const MOMO_PAYMENT_NUMBER_KEY = "momo_payment_number"
export const MOMO_PAYMENT_NAME_KEY = "momo_payment_name"
export const MOOLRE_ENABLED_KEY = "moolre_collection_enabled"

export const DEFAULT_MOMO_PAYMENT_NUMBER = "0594669717"
export const DEFAULT_MOMO_PAYMENT_NAME = "August Cargo Logistics"

export type PaymentSettings = {
  number: string
  name: string
  moolreEnabled: boolean
}

export async function resolvePaymentSettings(): Promise<PaymentSettings> {
  const number =
    (await settingsRepo.getSetting(MOMO_PAYMENT_NUMBER_KEY)) ?? DEFAULT_MOMO_PAYMENT_NUMBER
  const name = (await settingsRepo.getSetting(MOMO_PAYMENT_NAME_KEY)) ?? DEFAULT_MOMO_PAYMENT_NAME
  const moolreRaw = await settingsRepo.getSetting(MOOLRE_ENABLED_KEY)
  return { number, name, moolreEnabled: moolreRaw === "1" || moolreRaw === "true" }
}

export async function savePaymentSettings(
  number: string,
  name: string,
  moolreEnabled?: boolean,
): Promise<void> {
  await settingsRepo.setSetting(MOMO_PAYMENT_NUMBER_KEY, number)
  await settingsRepo.setSetting(MOMO_PAYMENT_NAME_KEY, name)
  if (typeof moolreEnabled === "boolean") {
    await settingsRepo.setSetting(MOOLRE_ENABLED_KEY, moolreEnabled ? "1" : "0")
  }
}

export async function isMoolreCollectionEnabled(): Promise<boolean> {
  const settings = await resolvePaymentSettings()
  return settings.moolreEnabled
}

/** Ghana MoMo (e.g. 0594669717) → WhatsApp wa.me digits (233594669717). */
export function momoNumberToWhatsApp(number: string): string {
  const digits = number.replace(/\D/g, "")
  if (digits.startsWith("233")) return digits
  if (digits.startsWith("0")) return `233${digits.slice(1)}`
  return digits
}

export function normalizeMomoNumber(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length < 9 || digits.length > 12) return null
  if (trimmed.startsWith("0")) return trimmed.replace(/\s/g, "")
  if (digits.startsWith("233") && digits.length >= 12) return `0${digits.slice(3)}`
  return `0${digits}`
}

export function normalizePaymentName(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed || trimmed.length > 120) return null
  return trimmed
}
