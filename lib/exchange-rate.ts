import { settingsRepo } from "@/lib/db/settings-repo"

/** Shown when admin sets rate to 0 or no rate is configured yet. */
export const RATE_PENDING_MESSAGE = "Rate will be posted soon"

/** RMB per 1 GHS (stored in app_settings). Display as GHS/RMB via 1/rate. */
export type ExchangeRateStatus = "active" | "pending"

export interface ExchangeRateState {
  status: ExchangeRateStatus
  /** RMB per 1 GHS; 0 when pending. */
  storedRate: number
  ghsPerRmb: number | null
  tradingEnabled: boolean
  message: string | null
}

function envDefaultRate(): number | null {
  const envDefault = process.env.DEFAULT_EXCHANGE_RATE
  if (!envDefault) return null
  const parsed = Number(envDefault)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/** Resolve current rate for API + server validation. */
export async function resolveExchangeRate(): Promise<ExchangeRateState> {
  const fromDb = await settingsRepo.getSingleRate()

  if (fromDb !== null) {
    if (fromDb === 0) {
      return {
        status: "pending",
        storedRate: 0,
        ghsPerRmb: null,
        tradingEnabled: false,
        message: RATE_PENDING_MESSAGE,
      }
    }
    if (fromDb > 0) {
      return {
        status: "active",
        storedRate: fromDb,
        ghsPerRmb: 1 / fromDb,
        tradingEnabled: true,
        message: null,
      }
    }
  }

  const envRate = envDefaultRate()
  if (envRate !== null) {
    return {
      status: "active",
      storedRate: envRate,
      ghsPerRmb: 1 / envRate,
      tradingEnabled: true,
      message: null,
    }
  }

  return {
    status: "pending",
    storedRate: 0,
    ghsPerRmb: null,
    tradingEnabled: false,
    message: RATE_PENDING_MESSAGE,
  }
}

/** Active trading rate only (null when pending or unconfigured). */
export async function getActiveExchangeRate(): Promise<number | null> {
  const state = await resolveExchangeRate()
  return state.tradingEnabled ? state.storedRate : null
}
