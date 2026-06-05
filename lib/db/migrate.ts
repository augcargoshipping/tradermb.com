import { getDbClient } from "./client"
import { schemaStatements } from "./schema"
import { settingsRepo } from "./settings-repo"
import {
  DEFAULT_MOMO_PAYMENT_NAME,
  DEFAULT_MOMO_PAYMENT_NUMBER,
  MOMO_PAYMENT_NAME_KEY,
  MOMO_PAYMENT_NUMBER_KEY,
} from "@/lib/payment-settings"

/** Older DBs may lack columns added after first deploy. */
async function ensureOrdersQrDataUriColumn(): Promise<void> {
  const db = getDbClient()
  try {
    await db.execute("ALTER TABLE orders ADD COLUMN qr_data_uri TEXT")
  } catch {
    // duplicate column name — already migrated
  }
}

async function ensureOrdersQrImageColumn(): Promise<void> {
  const db = getDbClient()
  try {
    await db.execute("ALTER TABLE orders ADD COLUMN qr_image BLOB")
  } catch {
    // duplicate column
  }
}

async function ensureOrdersQrMimeColumn(): Promise<void> {
  const db = getDbClient()
  try {
    await db.execute("ALTER TABLE orders ADD COLUMN qr_mime TEXT")
  } catch {
    // duplicate column
  }
}

async function seedDefaultPaymentSettings(): Promise<void> {
  const number = await settingsRepo.getSetting(MOMO_PAYMENT_NUMBER_KEY)
  if (!number) {
    await settingsRepo.setSetting(MOMO_PAYMENT_NUMBER_KEY, DEFAULT_MOMO_PAYMENT_NUMBER)
  }
  const name = await settingsRepo.getSetting(MOMO_PAYMENT_NAME_KEY)
  if (!name) {
    await settingsRepo.setSetting(MOMO_PAYMENT_NAME_KEY, DEFAULT_MOMO_PAYMENT_NAME)
  }
}

let migratePromise: Promise<void> | null = null

async function runMigrationsInternal(): Promise<void> {
  const db = getDbClient()
  for (const statement of schemaStatements) {
    await db.execute(statement)
  }
  await ensureOrdersQrDataUriColumn()
  await ensureOrdersQrImageColumn()
  await ensureOrdersQrMimeColumn()
  await seedDefaultPaymentSettings()
}

/** Run schema migrations once per server process (avoids slow repeat Turso work on every rate fetch). */
export async function runMigrations(): Promise<void> {
  if (!migratePromise) {
    migratePromise = runMigrationsInternal().catch((err) => {
      migratePromise = null
      throw err
    })
  }
  return migratePromise
}
