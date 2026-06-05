import { getDbClient } from "./client"
import { schemaStatements } from "./schema"

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

export async function runMigrations(): Promise<void> {
  const db = getDbClient()
  for (const statement of schemaStatements) {
    await db.execute(statement)
  }
  await ensureOrdersQrDataUriColumn()
  await ensureOrdersQrImageColumn()
  await ensureOrdersQrMimeColumn()
}
