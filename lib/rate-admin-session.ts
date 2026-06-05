import { createHmac, timingSafeEqual } from "crypto"

const SESSION_COOKIE = "rate_admin_session"
const SESSION_TTL_SECONDS = 60 * 60 * 8

function getSecret(): string {
  const secret = process.env.RATE_ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error("Missing RATE_ADMIN_SESSION_SECRET")
  }
  return secret
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex")
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE
}

export function createAdminSessionToken(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = String(expiresAt)
  const signature = signPayload(payload)
  return `${payload}.${signature}`
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return false

  const expiresAt = Number(payload)
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return false
  }

  const expected = signPayload(payload)
  const providedBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (providedBuf.length !== expectedBuf.length) {
    return false
  }
  return timingSafeEqual(providedBuf, expectedBuf)
}

export function validatePortalCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.RATE_PORTAL_USERNAME
  const expectedPass = process.env.RATE_PORTAL_PASSWORD
  if (!expectedUser || !expectedPass) return false
  return username === expectedUser && password === expectedPass
}
