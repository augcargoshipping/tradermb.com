import type { OrderRecord } from "@/lib/db/order-repo"
import { bytesToDataUri } from "@/lib/orders/blob"

/** Shape expected by `app/dashboard/page.tsx` (legacy Airtable-style `fields`). */
export type DashboardOrder = {
  id: number
  fields: {
    Reference_Code: string
    Submitted_At: string
    GHS_Amount: number
    RMB_Amount: number
    Status: string
    Customer_Name: string
    Mobile_Number: string
    Referral_Name: string
    Rate: string
    /** Data URI for customer Alipay QR when stored in Turso */
    QR_Image_Data_Uri: string | null
  }
}

export function orderRecordToDashboardOrder(o: OrderRecord): DashboardOrder {
  let qrUri: string | null = null
  if (o.qr_image && o.qr_image.length > 0) {
    qrUri = bytesToDataUri(o.qr_image, o.qr_mime || "image/png")
  } else if (o.qr_data_uri) {
    qrUri = o.qr_data_uri
  } else if (o.qr_url) {
    qrUri = o.qr_url
  }

  const rate =
    o.rmb_amount > 0
      ? `1 RMB = ${(o.ghs_amount / o.rmb_amount).toFixed(2)} GHS`
      : "N/A"

  return {
    id: o.id,
    fields: {
      Reference_Code: o.reference_code,
      Submitted_At: o.submitted_at,
      GHS_Amount: o.ghs_amount,
      RMB_Amount: o.rmb_amount,
      Status: o.status,
      Customer_Name: o.customer_name,
      Mobile_Number: o.mobile_number,
      Referral_Name: o.referral_name ?? "",
      Rate: rate,
      QR_Image_Data_Uri: qrUri,
    },
  }
}
