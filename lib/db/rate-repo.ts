import { getDbClient } from "./client"

export type RateType = "standard" | "low_rmb"

export interface RatesResult {
  standard: number | null
  lowRmb: number | null
}

export class RateRepo {
  async fetchAllRates(): Promise<RatesResult> {
    const db = getDbClient()
    const result = await db.execute("SELECT type, value FROM rates")

    let standard: number | null = null
    let lowRmb: number | null = null

    for (const row of result.rows as Array<Record<string, unknown>>) {
      const type = String(row.type)
      const value = Number(row.value)
      if (type === "standard") {
        standard = value
      } else if (type === "low_rmb") {
        lowRmb = value
      }
    }

    return { standard, lowRmb }
  }

  async getRateForAmount(
    rmbAmount: number,
  ): Promise<{ rate: number | null; type: "standard" | "low rmb" | null }> {
    const rates = await this.fetchAllRates()

    if (rmbAmount >= 1000) {
      if (rates.standard !== null) {
        return { rate: rates.standard, type: "standard" }
      }
    } else if (rates.lowRmb !== null) {
      return { rate: rates.lowRmb, type: "low rmb" }
    }

    if (rates.standard !== null) {
      return { rate: rates.standard, type: "standard" }
    }

    return { rate: null, type: null }
  }

  async upsertRate(type: RateType, value: number): Promise<void> {
    const db = getDbClient()
    await db.execute({
      sql: `INSERT INTO rates (type, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(type) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      args: [type, value],
    })
  }
}

export const rateRepo = new RateRepo()
