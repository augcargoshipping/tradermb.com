import { randomInt } from "crypto"

/** Short, easy-to-read code for payments and support (e.g. TR-482917). */
export function generateReferenceCode(): string {
  const digits = randomInt(100000, 1000000)
  return `TR-${digits}`
}
