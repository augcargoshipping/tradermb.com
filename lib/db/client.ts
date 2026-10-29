import { createClient, type Client } from "@libsql/client"

let clientInstance: Client | null = null
let loggedLocalFallback = false

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1"
}

export function getDbClient(): Client {
  if (clientInstance) {
    return clientInstance
  }

  const url = process.env.TURSO_DATABASE_URL?.trim()
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim()

  if (url && authToken) {
    clientInstance = createClient({ url, authToken })
    return clientInstance
  }

  if (isProductionRuntime()) {
    throw new Error("Missing required environment variable: TURSO_DATABASE_URL")
  }

  const fileUrl = process.env.LOCAL_SQLITE_URL?.trim() || "file:local-dev.db"
  if (!loggedLocalFallback) {
    console.warn("Turso not configured — using local SQLite for testing:", fileUrl)
    loggedLocalFallback = true
  }
  clientInstance = createClient({ url: fileUrl })
  return clientInstance
}
