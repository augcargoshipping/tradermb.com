import { convertGhsToRmb, convertRmbToGhs } from "@/lib/exchange-math"

/** Smallest GHS amount a customer can send. */
export const MIN_GHS_AMOUNT = 50

/** GHS at or above this uses the advertised (standard) rate. */
export const STANDARD_TIER_MIN_GHS = 1000

export type RateTier = "small" | "standard"

export type DualRates = {
  /** RMB per 1 GHS for trades of ₵1,000 and above. Shown on the homepage. */
  standard: number
  /** RMB per 1 GHS for trades from ₵50 up to ₵999.99. */
  small: number
}

export type TradeQuote = {
  ghs: number
  rmb: number
  rate: number
  tier: RateTier
}

export function rateTierForGhs(ghs: number): RateTier {
  return ghs >= STANDARD_TIER_MIN_GHS ? "standard" : "small"
}

export function isSmallTrade(ghs: number): boolean {
  return Number.isFinite(ghs) && ghs > 0 && ghs < STANDARD_TIER_MIN_GHS
}

export function appliedRateForGhs(ghs: number, rates: DualRates): number {
  return rateTierForGhs(ghs) === "standard" ? rates.standard : rates.small
}

export function quoteFromGhs(ghs: number, rates: DualRates): TradeQuote {
  const tier = rateTierForGhs(ghs)
  const rate = appliedRateForGhs(ghs, rates)
  return { ghs, rmb: convertGhsToRmb(ghs, rate), rate, tier }
}

/**
 * Quote a target RMB amount. Tier is decided by the GHS the customer would pay.
 * RMB is then recalculated from that GHS so the ticket always matches the applied rate.
 */
export function quoteFromRmb(rmb: number, rates: DualRates): TradeQuote {
  const ghsAtStandard = convertRmbToGhs(rmb, rates.standard)
  if (ghsAtStandard >= STANDARD_TIER_MIN_GHS) {
    return quoteFromGhs(ghsAtStandard, rates)
  }

  const ghsAtSmall = convertRmbToGhs(rmb, rates.small)
  return quoteFromGhs(ghsAtSmall, rates)
}

export function minGhsError(ghs: number): string | null {
  if (!Number.isFinite(ghs) || ghs <= 0) return "Enter how much GHS you want to send"
  if (ghs < MIN_GHS_AMOUNT) {
    return `The minimum trade is ₵${MIN_GHS_AMOUNT}. Enter ₵${MIN_GHS_AMOUNT} or more.`
  }
  return null
}
