import { getDbClient } from "./client"
import { readBlobField } from "@/lib/orders/blob"

export type OrderStatus = "Pending" | "Paid" | "Completed" | "Cancelled"

export interface CreateOrderInput {
  customerName: string
  emailAddress: string
  mobileNumber: string
  referralName?: string
  ghsAmount: number
  rmbAmount: number
  referenceCode: string
  status?: OrderStatus
  submittedAt: string
  /** Raw Alipay QR image bytes stored in Turso (BLOB) */
  qrImage?: Uint8Array | Buffer | null
  qrMime?: string | null
  userId?: string | null
}

export interface OrderRecord {
  id: number
  customer_name: string
  email_address: string
  mobile_number: string
  referral_name: string | null
  ghs_amount: number
  rmb_amount: number
  reference_code: string
  status: OrderStatus
  submitted_at: string
  /** Legacy Cloudinary URL (no longer written) */
  qr_url: string | null
  /** Legacy inline TEXT (no longer written) */
  qr_data_uri: string | null
  qr_image: Uint8Array | null
  qr_mime: string | null
  user_id: string | null
  momo_confirmed_at: string | null
  created_at: string
  updated_at: string
}

function mapOrder(row: Record<string, unknown>): OrderRecord {
  const blob = readBlobField(row.qr_image)
  return {
    id: Number(row.id),
    customer_name: String(row.customer_name),
    email_address: String(row.email_address),
    mobile_number: String(row.mobile_number),
    referral_name: row.referral_name ? String(row.referral_name) : null,
    ghs_amount: Number(row.ghs_amount),
    rmb_amount: Number(row.rmb_amount),
    reference_code: String(row.reference_code),
    status: String(row.status) as OrderStatus,
    submitted_at: String(row.submitted_at),
    qr_url: row.qr_url ? String(row.qr_url) : null,
    qr_data_uri:
      row.qr_data_uri != null && String(row.qr_data_uri).length > 0 ? String(row.qr_data_uri) : null,
    qr_image: blob,
    qr_mime: row.qr_mime != null && String(row.qr_mime).length > 0 ? String(row.qr_mime) : null,
    user_id: row.user_id ? String(row.user_id) : null,
    momo_confirmed_at:
      row.momo_confirmed_at != null && String(row.momo_confirmed_at).length > 0
        ? String(row.momo_confirmed_at)
        : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export class OrderRepo {
  async referenceCodeExists(referenceCode: string): Promise<boolean> {
    const db = getDbClient()
    const result = await db.execute({
      sql: `SELECT 1 FROM orders WHERE reference_code = ? LIMIT 1`,
      args: [referenceCode],
    })
    return result.rows.length > 0
  }

  async createOrder(input: CreateOrderInput): Promise<number> {
    const db = getDbClient()
    const qrBytes =
      input.qrImage instanceof Buffer
        ? new Uint8Array(input.qrImage)
        : input.qrImage instanceof Uint8Array
          ? input.qrImage
          : null
    const qrMime = input.qrMime?.trim() || (qrBytes && qrBytes.length > 0 ? "image/png" : null)

    const blobArg: Buffer | ArrayBuffer | null =
      qrBytes && qrBytes.length > 0 ? Buffer.from(qrBytes) : null

    const result = await db.execute({
      sql: `INSERT INTO orders (
        customer_name, email_address, mobile_number, referral_name, ghs_amount, rmb_amount,
        reference_code, status, submitted_at, qr_url, qr_data_uri, qr_image, qr_mime, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
      args: [
        input.customerName,
        input.emailAddress,
        input.mobileNumber,
        input.referralName ?? null,
        input.ghsAmount,
        input.rmbAmount,
        input.referenceCode,
        input.status ?? "Pending",
        input.submittedAt,
        blobArg,
        qrMime,
        input.userId ?? null,
      ],
    })

    return Number(result.lastInsertRowid)
  }

  async getOrderById(id: number): Promise<OrderRecord | null> {
    const db = getDbClient()
    const result = await db.execute({
      sql: `SELECT * FROM orders WHERE id = ? LIMIT 1`,
      args: [id],
    })
    if (!result.rows.length) return null
    return mapOrder(result.rows[0] as Record<string, unknown>)
  }

  async confirmMomoPayment(id: number, referenceCode: string): Promise<{
    newlyConfirmed: boolean
    order: OrderRecord
  } | null> {
    const order = await this.getOrderById(id)
    if (!order || order.reference_code !== referenceCode) return null

    if (order.momo_confirmed_at) {
      return { newlyConfirmed: false, order }
    }

    const db = getDbClient()
    const now = new Date().toISOString()
    await db.execute({
      sql: `UPDATE orders SET momo_confirmed_at = ?, status = ?, updated_at = ? WHERE id = ?`,
      args: [now, "Paid", now, id],
    })

    return {
      newlyConfirmed: true,
      order: { ...order, momo_confirmed_at: now, status: "Paid", updated_at: now },
    }
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<boolean> {
    const db = getDbClient()
    const check = await db.execute({
      sql: `SELECT id FROM orders WHERE id = ?`,
      args: [id],
    })
    if (check.rows.length === 0) return false
    const now = new Date().toISOString()
    await db.execute({
      sql: `UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`,
      args: [status, now, id],
    })
    return true
  }

  async getOrdersByUserIdentifiers(identifiers: {
    userId?: string | null
    email?: string | null
    mobileNumber?: string | null
    fullName?: string | null
  }): Promise<OrderRecord[]> {
    const db = getDbClient()
    const clauses: string[] = []
    const args: Array<string> = []

    if (identifiers.userId) {
      clauses.push("user_id = ?")
      args.push(identifiers.userId)
    }
    if (identifiers.email) {
      clauses.push("email_address = ?")
      args.push(identifiers.email)
    }
    if (identifiers.mobileNumber) {
      clauses.push("mobile_number = ?")
      args.push(identifiers.mobileNumber)
    }
    if (identifiers.fullName) {
      clauses.push("customer_name = ?")
      args.push(identifiers.fullName)
    }

    if (clauses.length === 0) {
      return []
    }

    const result = await db.execute({
      sql: `SELECT * FROM orders WHERE ${clauses.join(" OR ")} ORDER BY submitted_at DESC`,
      args,
    })

    return result.rows.map((row) => mapOrder(row as Record<string, unknown>))
  }

  /** Dashboard list — omits QR blobs and large inline QR data. */
  async getOrdersByUserIdentifiersSummary(identifiers: {
    userId?: string | null
    email?: string | null
    mobileNumber?: string | null
    fullName?: string | null
  }): Promise<DashboardOrderSummary[]> {
    const db = getDbClient()
    const clauses: string[] = []
    const args: Array<string> = []

    if (identifiers.userId) {
      clauses.push("user_id = ?")
      args.push(identifiers.userId)
    }
    if (identifiers.email) {
      clauses.push("email_address = ?")
      args.push(identifiers.email)
    }
    if (identifiers.mobileNumber) {
      clauses.push("mobile_number = ?")
      args.push(identifiers.mobileNumber)
    }
    if (identifiers.fullName) {
      clauses.push("customer_name = ?")
      args.push(identifiers.fullName)
    }

    if (clauses.length === 0) {
      return []
    }

    const result = await db.execute({
      sql: `SELECT id, customer_name, email_address, mobile_number, referral_name,
                   ghs_amount, rmb_amount, reference_code, status, submitted_at
            FROM orders WHERE ${clauses.join(" OR ")} ORDER BY submitted_at DESC`,
      args,
    })

    return result.rows.map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: Number(r.id),
        customer_name: String(r.customer_name),
        email_address: String(r.email_address),
        mobile_number: String(r.mobile_number),
        referral_name: r.referral_name ? String(r.referral_name) : null,
        ghs_amount: Number(r.ghs_amount),
        rmb_amount: Number(r.rmb_amount),
        reference_code: String(r.reference_code),
        status: String(r.status) as OrderStatus,
        submitted_at: String(r.submitted_at),
      }
    })
  }

  async listRecentOrders(limit: number): Promise<OrderRecord[]> {
    const db = getDbClient()
    const result = await db.execute({
      sql: `SELECT * FROM orders ORDER BY submitted_at DESC LIMIT ?`,
      args: [limit],
    })
    return result.rows.map((row) => mapOrder(row as Record<string, unknown>))
  }

  /** Fast admin list — omits QR BLOBs (load per order via getOrderQrDataUri). */
  async listRecentOrdersSummary(limit: number): Promise<AdminOrderSummary[]> {
    const db = getDbClient()
    const result = await db.execute({
      sql: `SELECT id, customer_name, email_address, mobile_number, referral_name,
                   ghs_amount, rmb_amount, reference_code, status, submitted_at,
                   qr_url, qr_data_uri, qr_mime,
                   CASE WHEN qr_image IS NOT NULL AND length(qr_image) > 0 THEN 1 ELSE 0 END AS has_qr_blob
            FROM orders ORDER BY submitted_at DESC LIMIT ?`,
      args: [limit],
    })
    return result.rows.map((row) => {
      const r = row as Record<string, unknown>
      const hasLegacyQr =
        (r.qr_data_uri != null && String(r.qr_data_uri).length > 0) ||
        (r.qr_url != null && String(r.qr_url).length > 0)
      const hasQrBlob = Number(r.has_qr_blob) === 1
      return {
        id: Number(r.id),
        customer_name: String(r.customer_name),
        email_address: String(r.email_address),
        mobile_number: String(r.mobile_number),
        referral_name: r.referral_name ? String(r.referral_name) : null,
        ghs_amount: Number(r.ghs_amount),
        rmb_amount: Number(r.rmb_amount),
        reference_code: String(r.reference_code),
        status: String(r.status) as OrderStatus,
        submitted_at: String(r.submitted_at),
        has_qr: hasQrBlob || hasLegacyQr,
      }
    })
  }

  async getOrderQrDataUri(id: number): Promise<string | null> {
    const order = await this.getOrderById(id)
    if (!order) return null
    if (order.qr_image && order.qr_image.length > 0) {
      const { bytesToDataUri } = await import("@/lib/orders/blob")
      return bytesToDataUri(order.qr_image, order.qr_mime || "image/png")
    }
    if (order.qr_data_uri) return order.qr_data_uri
    if (order.qr_url) return order.qr_url
    return null
  }
}

export interface DashboardOrderSummary {
  id: number
  customer_name: string
  email_address: string
  mobile_number: string
  referral_name: string | null
  ghs_amount: number
  rmb_amount: number
  reference_code: string
  status: OrderStatus
  submitted_at: string
}

export interface AdminOrderSummary {
  id: number
  customer_name: string
  email_address: string
  mobile_number: string
  referral_name: string | null
  ghs_amount: number
  rmb_amount: number
  reference_code: string
  status: OrderStatus
  submitted_at: string
  has_qr: boolean
}

export const orderRepo = new OrderRepo()
