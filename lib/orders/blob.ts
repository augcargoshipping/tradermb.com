/** Normalize libSQL / driver blob values into bytes. */
export function readBlobField(value: unknown): Uint8Array | null {
  if (value == null) return null
  if (value instanceof Uint8Array) return value.byteLength ? value : null
  if (value instanceof Buffer) return value.length ? new Uint8Array(value) : null
  if (value instanceof ArrayBuffer) return value.byteLength ? new Uint8Array(value) : null
  if (typeof value === "string" && value.length > 0) {
    try {
      const buf = Buffer.from(value, "base64")
      return buf.length ? new Uint8Array(buf) : null
    } catch {
      return null
    }
  }
  return null
}

export function bytesToDataUri(bytes: Uint8Array, mime: string): string {
  const safeMime = mime && mime.startsWith("image/") ? mime : "image/png"
  const b64 = Buffer.from(bytes).toString("base64")
  return `data:${safeMime};base64,${b64}`
}
