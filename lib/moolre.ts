export { MOOLRE_CHANNELS, type MoolreNetwork, guessMoolreNetwork, normalizeGhMomoNumber } from "@/lib/moolre-networks"
import { normalizeGhMomoNumber } from "@/lib/moolre-networks"

export type MoolreCollectResult =
  | { kind: "otp_required"; message: string }
  | { kind: "prompt_sent"; paymentId: string | null; message: string }
  | { kind: "error"; message: string; code: string | null }

type MoolreEnvelope = {
  status?: number | string
  code?: string
  message?: string | null
  data?: unknown
}

const LIVE_API = "https://api.moolre.com"

export function formatGhsAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}

export function amountsMatch(expected: number, reported: number): boolean {
  return Number.isFinite(reported) && Math.abs(reported - expected) <= 0.05
}

export function getMoolreConfig(): {
  user: string
  pubKey: string
  accountNumber: string
  apiBase: string
  webhookSecret: string
} {
  const user = process.env.MOOLRE_API_USER?.trim() ?? ""
  const pubKey = process.env.MOOLRE_API_PUBKEY?.trim() ?? ""
  const accountNumber = process.env.MOOLRE_ACCOUNT_NUMBER?.trim() ?? ""
  const apiBase = (process.env.MOOLRE_API_BASE?.trim() || LIVE_API).replace(/\/$/, "")
  const webhookSecret = process.env.MOOLRE_WEBHOOK_SECRET?.trim() ?? ""
  return { user, pubKey, accountNumber, apiBase, webhookSecret }
}

export function moolreConfigured(): boolean {
  const { user, pubKey, accountNumber } = getMoolreConfig()
  return Boolean(user && pubKey && accountNumber)
}

function headers(): HeadersInit {
  const { user, pubKey } = getMoolreConfig()
  return {
    "Content-Type": "application/json",
    "X-API-USER": user,
    "X-API-PUBKEY": pubKey,
  }
}

function codeOf(body: MoolreEnvelope): string {
  return String(body.code ?? "").trim().toUpperCase()
}

function statusOk(body: MoolreEnvelope): boolean {
  return body.status === 1 || body.status === "1"
}

function messageOf(body: MoolreEnvelope, fallback: string): string {
  const msg = typeof body.message === "string" ? body.message.trim() : ""
  return msg || fallback
}

function userFacingMoolreError(message: string): string {
  if (/merchant account setup incomplete/i.test(message)) {
    return `Moolre has not finished activating this merchant wallet, so it cannot collect MoMo yet. In the Moolre dashboard complete ID verification, activate the wallet, and attach this API service to it. ${message}`
  }
  return message
}

function dataString(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) return data.trim()
  if (data && typeof data === "object" && "id" in data) {
    const id = (data as { id?: unknown }).id
    if (typeof id === "string" && id.trim()) return id.trim()
  }
  return null
}

export async function moolreInitiatePayment(input: {
  payer: string
  amount: number
  externalref: string
  channel: string
  otpcode?: string
}): Promise<MoolreCollectResult> {
  const { accountNumber, apiBase } = getMoolreConfig()
  const payload: Record<string, unknown> = {
    type: 1,
    channel: input.channel,
    currency: "GHS",
    payer: normalizeGhMomoNumber(input.payer),
    amount: formatGhsAmount(input.amount),
    externalref: input.externalref,
    accountnumber: accountNumber,
    reference: input.externalref,
  }
  if (input.otpcode?.trim()) payload.otpcode = input.otpcode.trim()

  const body = await moolrePost(`${apiBase}/open/transact/payment`, payload)
  const code = codeOf(body)
  const msg = messageOf(body, "Could not start mobile money payment.")

  if (code === "TP14") {
    return { kind: "otp_required", message: msg }
  }
  if (code === "TR099" && statusOk(body)) {
    return { kind: "prompt_sent", paymentId: dataString(body.data), message: "Approve the prompt on your phone." }
  }
  if (input.otpcode && statusOk(body) && !/invalid/i.test(msg)) {
    return moolreInitiatePayment({ ...input, otpcode: undefined })
  }
  if (code === "TP13") {
    return { kind: "error", message: "This payment reference was already used. Try again.", code }
  }
  if (/invalid.?otp/i.test(msg) || code === "TP16" || code === "TP15") {
    return { kind: "error", message: "That OTP is not valid. Request a new prompt and try again.", code }
  }
  return { kind: "error", message: userFacingMoolreError(msg), code: code || null }
}

export type MoolreTxStatus = {
  txstatus: number | null
  amount: number | null
  transactionId: string | null
  externalref: string | null
  code: string
  message: string
}

export async function moolrePaymentStatus(externalref: string): Promise<MoolreTxStatus> {
  const { accountNumber, apiBase } = getMoolreConfig()
  const body = await moolrePost(`${apiBase}/open/transact/status`, {
    type: 1,
    idtype: 1,
    id: externalref,
    accountnumber: accountNumber,
  })
  const data = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : {}
  const txRaw = data.txstatus
  const txstatus = typeof txRaw === "number" ? txRaw : Number.parseInt(String(txRaw ?? ""), 10)
  const amountRaw = data.amount ?? data.value
  const amount = Number.parseFloat(String(amountRaw ?? ""))
  const transactionId =
    data.transactionid != null && String(data.transactionid).length > 0 ? String(data.transactionid) : null

  return {
    txstatus: Number.isFinite(txstatus) ? txstatus : null,
    amount: Number.isFinite(amount) ? amount : null,
    transactionId,
    externalref: data.externalref != null ? String(data.externalref) : externalref,
    code: codeOf(body),
    message: messageOf(body, "Could not check payment status."),
  }
}

async function moolrePost(url: string, payload: Record<string, unknown>): Promise<MoolreEnvelope> {
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
    cache: "no-store",
  })
  let body: MoolreEnvelope = {}
  try {
    body = (await res.json()) as MoolreEnvelope
  } catch {
    body = { status: 0, message: `Moolre returned HTTP ${res.status}` }
  }
  if (!res.ok && !body.message) {
    body.message = `Moolre returned HTTP ${res.status}`
  }
  return body
}
