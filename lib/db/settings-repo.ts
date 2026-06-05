import { getDbClient } from "./client"

const SINGLE_RATE_KEY = "single_exchange_rate"

export class SettingsRepo {
  async getSingleRate(): Promise<number | null> {
    const db = getDbClient()
    const result = await db.execute({
      sql: "SELECT value FROM app_settings WHERE key = ? LIMIT 1",
      args: [SINGLE_RATE_KEY],
    })

    if (!result.rows.length) {
      return null
    }

    const value = Number(result.rows[0].value)
    return Number.isFinite(value) ? value : null
  }

  async setSingleRate(rate: number): Promise<void> {
    const db = getDbClient()
    await db.execute({
      sql: `INSERT INTO app_settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      args: [SINGLE_RATE_KEY, String(rate)],
    })
  }
}

export const settingsRepo = new SettingsRepo()
