import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, "..", ".env.local")
const env = fs.readFileSync(envPath, "utf8")
const token = env.match(/AIRTABLE_PERSONAL_ACCESS_TOKEN=(.+)/)?.[1]?.trim()
const baseId = env.match(/AIRTABLE_BASE_ID=(.+)/)?.[1]?.trim() || "appJmAIhfFTKCcITA"

async function tryTable(name) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(name)}?maxRecords=1`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const body = await res.json()
  return { name, status: res.status, ok: res.ok, error: body.error, records: body.records?.length }
}

async function main() {
  console.log("Base:", baseId)
  const whoami = await fetch("https://api.airtable.com/v0/meta/whoami", {
    headers: { Authorization: `Bearer ${token}` },
  })
  console.log("whoami:", whoami.status)

  const meta = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const metaBody = await meta.json()
  if (meta.ok && metaBody.tables) {
    console.log("Tables:", metaBody.tables.map((t) => t.name).join(", "))
  } else {
    console.log("meta/tables:", meta.status, metaBody.error?.type || metaBody.error)
  }

  for (const t of ["USERS", "CUSTOMERS", "RATES"]) {
    console.log(await tryTable(t))
  }
}

main().catch(console.error)
