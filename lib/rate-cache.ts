import { RATE_PENDING_MESSAGE } from "@/lib/exchange-rate"
import { MIN_GHS_AMOUNT, STANDARD_TIER_MIN_GHS } from "@/lib/trade-policy"

const RATE_CACHE_KEY = "tradeRmbExchangeRate:v2"

export type CachedRateStatus = "active" | "pending"

export type CachedExchangeRate = {
  rate: number
  smallRate: number
  ghsPerRmb: number | null
  status: CachedRateStatus
  tradingEnabled: boolean
  pendingMessage: string
  minGhs: number
  standardFromGhs: number
}

export function readCachedExchangeRate(): CachedExchangeRate | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(RATE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedExchangeRate
    if (parsed.status === "active" && typeof parsed.rate === "number" && parsed.rate > 0) {
      return {
        ...parsed,
        smallRate: parsed.smallRate > 0 ? parsed.smallRate : parsed.rate,
        minGhs: parsed.minGhs || MIN_GHS_AMOUNT,
        standardFromGhs: parsed.standardFromGhs || STANDARD_TIER_MIN_GHS,
      }
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
    smallRate: cache.status === "active" ? cache.smallRate : 0,
    ghsPerRmb: cache.ghsPerRmb,
    status: cache.status,
    tradingEnabled: cache.tradingEnabled,
    pendingMessage: cache.pendingMessage || RATE_PENDING_MESSAGE,
    loading: false,
    minGhs: cache.minGhs || MIN_GHS_AMOUNT,
    standardFromGhs: cache.standardFromGhs || STANDARD_TIER_MIN_GHS,
  }
}
