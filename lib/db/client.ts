import { createClient, type Client } from "@libsql/client"

let clientInstance: Client | null = null

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getDbClient(): Client {
  if (clientInstance) {
    return clientInstance
  }

  const url = getEnv("TURSO_DATABASE_URL")
  const authToken = getEnv("TURSO_AUTH_TOKEN")
  clientInstance = createClient({ url, authToken })

  return clientInstance
}
