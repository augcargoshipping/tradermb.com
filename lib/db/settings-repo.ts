import { getDbClient } from "./client"

const SINGLE_RATE_KEY = "single_exchange_rate"
const SMALL_RATE_KEY = "small_exchange_rate"

export class SettingsRepo {
  async getSetting(key: string): Promise<string | null> {
    const db = getDbClient()
    const result = await db.execute({
      sql: "SELECT value FROM app_settings WHERE key = ? LIMIT 1",
      args: [key],
    })

    if (!result.rows.length) {
      return null
    }

    const value = result.rows[0].value
    return typeof value === "string" && value.length > 0 ? value : null
  }

  async setSetting(key: string, value: string): Promise<void> {
    const db = getDbClient()
    await db.execute({
      sql: `INSERT INTO app_settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      args: [key, value],
    })
  }

  async getSingleRate(): Promise<number | null> {
    const raw = await this.getSetting(SINGLE_RATE_KEY)
    if (raw === null) return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  }

  async setSingleRate(rate: number): Promise<void> {
    await this.setSetting(SINGLE_RATE_KEY, String(rate))
  }

  async getSmallRate(): Promise<number | null> {
    const raw = await this.getSetting(SMALL_RATE_KEY)
    if (raw === null) return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  }

  async setSmallRate(rate: number): Promise<void> {
    await this.setSetting(SMALL_RATE_KEY, String(rate))
  }

  /** Standard (₵1,000+) plus small-trade rate. Small falls back to standard if unset. */
  async getDualRates(): Promise<{ standard: number | null; small: number | null }> {
    const standard = await this.getSingleRate()
    const small = await this.getSmallRate()
    return {
      standard,
      small: small !== null ? small : standard,
    }
  }
}

export const settingsRepo = new SettingsRepo()
