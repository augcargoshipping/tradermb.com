import dotenv from "dotenv"
import { runMigrations } from "../lib/db/migrate"
import { getDbClient } from "../lib/db/client"
import { rateRepo } from "../lib/db/rate-repo"

dotenv.config({ path: ".env.local" })

const baseId = process.env.AIRTABLE_BASE_ID
const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
const dryRun = process.argv.includes("--dry-run")

if (!baseId || !token) {
  console.error("Missing AIRTABLE_BASE_ID or AIRTABLE_PERSONAL_ACCESS_TOKEN")
  process.exit(1)
}

const headers = { Authorization: `Bearer ${token}` }

async function fetchAllRecords(table: string) {
  const records: Array<{ id: string; fields: Record<string, unknown> }> = []
  let offset: string | undefined

  do {
    const search = new URLSearchParams()
    search.set("pageSize", "100")
    if (offset) {
      search.set("offset", offset)
    }

    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${table}?${search.toString()}`, { headers })
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Airtable request failed (${table}): ${response.status} ${body}`)
    }

    const payload = await response.json()
    if (Array.isArray(payload.records)) {
      records.push(...payload.records)
    }
    offset = payload.offset
  } while (offset)

  return records
}

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return String(value)
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

async function migrateOrders() {
  const db = getDbClient()
  const records = await fetchAllRecords("CUSTOMERS")
  let migrated = 0

  for (const record of records) {
    const f = record.fields
    const customerName = asString(f.Customer_Name)
    const emailAddress = asString(f.Email_Address)
    const mobileNumber = asString(f.Mobile_Number)
    const ghsAmount = asNumber(f.GHS_Amount)
    const rmbAmount = asNumber(f.RMB_Amount)
    const referenceCode = asString(f.Reference_Code)
    const submittedAt = asString(f.Submitted_At) ?? new Date().toISOString()

    if (!customerName || !emailAddress || !mobileNumber || !ghsAmount || !rmbAmount || !referenceCode) {
      continue
    }

    const args = [
      customerName,
      emailAddress,
      mobileNumber,
      asString(f.Referral_Name),
      ghsAmount,
      rmbAmount,
      referenceCode,
      asString(f.Status) ?? "Pending",
      submittedAt,
      asString(f.QR_CODE),
      null,
      null,
      null,
      asString(f.user_id),
    ]

    if (dryRun) {
      migrated += 1
      continue
    }

    await db.execute({
      sql: `INSERT INTO orders (
        customer_name, email_address, mobile_number, referral_name, ghs_amount, rmb_amount,
        reference_code, status, submitted_at, qr_url, qr_data_uri, qr_image, qr_mime, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(reference_code) DO UPDATE SET
        customer_name = excluded.customer_name,
        email_address = excluded.email_address,
        mobile_number = excluded.mobile_number,
        referral_name = excluded.referral_name,
        ghs_amount = excluded.ghs_amount,
        rmb_amount = excluded.rmb_amount,
        status = excluded.status,
        submitted_at = excluded.submitted_at,
        qr_url = excluded.qr_url,
        user_id = excluded.user_id,
        updated_at = CURRENT_TIMESTAMP`,
      args,
    })
    migrated += 1
  }

  console.log(`${dryRun ? "Would migrate" : "Migrated"} ${migrated} orders`)
}

async function migrateRates() {
  const records = await fetchAllRecords("RATES")
  let migrated = 0

  for (const record of records) {
    const typeRaw = asString(record.fields.type)
    const value = asNumber(record.fields.value)
    if (!typeRaw || value === null) continue

    const mappedType = typeRaw === "low rmb" ? "low_rmb" : typeRaw
    if (mappedType !== "standard" && mappedType !== "low_rmb") continue

    if (!dryRun) {
      await rateRepo.upsertRate(mappedType, value)
    }
    migrated += 1
  }

  console.log(`${dryRun ? "Would migrate" : "Migrated"} ${migrated} rates`)
}

async function main() {
  await runMigrations()
  await migrateOrders()
  await migrateRates()
}

main().catch((error) => {
  console.error("Failed to migrate Airtable to SQLite:", error)
  process.exit(1)
})
