import { RATE_PENDING_MESSAGE } from "@/lib/exchange-rate"

const RATE_CACHE_KEY = "tradeRmbExchangeRate"

export type CachedRateStatus = "active" | "pending"

export type CachedExchangeRate = {
  rate: number
  ghsPerRmb: number | null
  status: CachedRateStatus
  tradingEnabled: boolean
  pendingMessage: string
}

export function readCachedExchangeRate(): CachedExchangeRate | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(RATE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedExchangeRate
    if (parsed.status === "active" && typeof parsed.rate === "number" && parsed.rate > 0) {
      return parsed
    }
    if (parsed.status === "pending") {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function writeCachedExchangeRate(data: CachedExchangeRate): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(RATE_CACHE_KEY, JSON.stringify(data))
  } catch {
    // private browsing / quota — ignore
  }
}

export function cachedRateToState(cache: CachedExchangeRate) {
  return {
    rate: cache.status === "active" ? cache.rate : 0,
    ghsPerRmb: cache.ghsPerRmb,
    status: cache.status,
    tradingEnabled: cache.tradingEnabled,
    pendingMessage: cache.pendingMessage || RATE_PENDING_MESSAGE,
    loading: false,
  }
}
