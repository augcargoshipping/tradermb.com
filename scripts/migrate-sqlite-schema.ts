import dotenv from "dotenv"
import { runMigrations } from "../lib/db/migrate"

dotenv.config({ path: ".env.local" })

async function main() {
  await runMigrations()
  console.log("SQLite schema migration complete.")
}

main().catch((error) => {
  console.error("Failed to run SQLite schema migration:", error)
  process.exit(1)
})
