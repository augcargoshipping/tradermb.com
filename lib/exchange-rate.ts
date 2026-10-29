import { settingsRepo } from "@/lib/db/settings-repo"
import {
  appliedRateForGhs,
  MIN_GHS_AMOUNT,
  STANDARD_TIER_MIN_GHS,
  type DualRates,
} from "@/lib/trade-policy"

/** Shown when admin sets rate to 0 or no rate is configured yet. */
export const RATE_PENDING_MESSAGE = "Rate will be posted soon"

/** RMB per 1 GHS (stored in app_settings). Display as 1 GHS = stored RMB. */
export type ExchangeRateStatus = "active" | "pending"

export interface ExchangeRateState {
  status: ExchangeRateStatus
  /** Advertised / ₵1,000+ rate (RMB per 1 GHS). 0 when pending. */
  storedRate: number
  /** Rate for trades under ₵1,000. */
  smallRate: number
  ghsPerRmb: number | null
  tradingEnabled: boolean
  message: string | null
  minGhs: number
  standardFromGhs: number
}

function parsePositiveRate(raw: string | undefined): number | null {
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function envDefaultRates(): { standard: number; small: number } | null {
  const standard = parsePositiveRate(process.env.DEFAULT_EXCHANGE_RATE)
  if (standard === null) return null
  const small = parsePositiveRate(process.env.DEFAULT_SMALL_EXCHANGE_RATE) ?? standard
  return { standard, small }
}

function pendingState(): ExchangeRateState {
  return {
    status: "pending",
    storedRate: 0,
    smallRate: 0,
    ghsPerRmb: null,
    tradingEnabled: false,
    message: RATE_PENDING_MESSAGE,
    minGhs: MIN_GHS_AMOUNT,
    standardFromGhs: STANDARD_TIER_MIN_GHS,
  }
}

function activeState(standard: number, small: number): ExchangeRateState {
  return {
    status: "active",
    storedRate: standard,
    smallRate: small,
    ghsPerRmb: 1 / standard,
    tradingEnabled: true,
    message: null,
    minGhs: MIN_GHS_AMOUNT,
    standardFromGhs: STANDARD_TIER_MIN_GHS,
  }
}

function fromEnvOrPending(): ExchangeRateState {
  const envRates = envDefaultRates()
  if (envRates) return activeState(envRates.standard, envRates.small)
  return pendingState()
}

/** Resolve current rates for API + server validation. */
export async function resolveExchangeRate(): Promise<ExchangeRateState> {
  try {
    const { standard, small } = await settingsRepo.getDualRates()

    if (standard !== null) {
      if (standard === 0) return pendingState()
      if (standard > 0) {
        const smallRate = small !== null && small > 0 ? small : standard
        return activeState(standard, smallRate)
      }
    }
  } catch {
    // Local preview without Turso — use DEFAULT_* rates from .env.local
  }

  return fromEnvOrPending()
}

export function dualRatesFromState(state: ExchangeRateState): DualRates {
  return { standard: state.storedRate, small: state.smallRate }
}

export function rateForGhsAmount(ghs: number, state: ExchangeRateState): number {
  return appliedRateForGhs(ghs, dualRatesFromState(state))
}

/** Active advertised rate only (null when pending or unconfigured). */
export async function getActiveExchangeRate(): Promise<number | null> {
  const state = await resolveExchangeRate()
  return state.tradingEnabled ? state.storedRate : null
}
