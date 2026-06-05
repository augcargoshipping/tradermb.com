import dotenv from "dotenv"
import { runMigrations } from "../lib/db/migrate"
import { rateRepo } from "../lib/db/rate-repo"

dotenv.config({ path: ".env.local" })

async function main() {
  const standard = Number(process.argv[2] ?? "0")
  const lowRmb = Number(process.argv[3] ?? "0")

  if (!standard || !lowRmb || Number.isNaN(standard) || Number.isNaN(lowRmb)) {
    console.error("Usage: npm run seed:rates -- <standardRate> <lowRmbRate>")
    process.exit(1)
  }

  await runMigrations()
  await rateRepo.upsertRate("standard", standard)
  await rateRepo.upsertRate("low_rmb", lowRmb)

  console.log(`Seeded rates: standard=${standard}, low_rmb=${lowRmb}`)
}

main().catch((error) => {
  console.error("Failed to seed rates:", error)
  process.exit(1)
})
