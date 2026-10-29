export const MOOLRE_CHANNELS = {
  mtn: "13",
  telecel: "6",
  at: "7",
} as const

export type MoolreNetwork = keyof typeof MOOLRE_CHANNELS

export function guessMoolreNetwork(mobile: string): MoolreNetwork {
  const n = normalizeGhMomoNumber(mobile)
  const prefix = n.slice(0, 3)
  if (["024", "054", "055", "059", "025", "053"].includes(prefix)) return "mtn"
  if (["020", "050"].includes(prefix)) return "telecel"
  if (["027", "057", "026", "056"].includes(prefix)) return "at"
  return "mtn"
}

export function normalizeGhMomoNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("233") && digits.length >= 12) {
    return `0${digits.slice(3, 12)}`
  }
  if (digits.length >= 9 && digits.startsWith("0")) {
    return digits.slice(0, 10)
  }
  if (digits.length === 9 && !digits.startsWith("0")) {
    return `0${digits}`
  }
  return digits.slice(0, 10)
}

export function isValidGhMomoNumber(raw: string): boolean {
  return /^0[235][0-9]\d{7}$/.test(normalizeGhMomoNumber(raw))
}
