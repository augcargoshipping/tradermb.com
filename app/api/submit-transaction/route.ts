import { type NextRequest, NextResponse } from "next/server"
import { generateReferenceCode } from "@/lib/reference-code"
import { resolveExchangeRate } from "@/lib/exchange-rate"
import { runMigrations } from "@/lib/db/migrate"
import { orderRepo } from "@/lib/db/order-repo"
import { getAuthSession } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const session = await getAuthSession()
    const userId = session?.user?.userId ?? null

    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const mobileNumber = formData.get("mobileNumber") as string
    const referralName = formData.get("referralName") as string
    const ghsAmount = formData.get("ghsAmount") as string
    const rmbAmount = formData.get("rmbAmount") as string
    const exchangeRate = formData.get("exchangeRate") as string
    const qrEntry = formData.get("alipayQR")
    const qrFile = qrEntry instanceof File && qrEntry.size > 0 ? qrEntry : null

    if (!fullName || !email || !mobileNumber || !ghsAmount || !rmbAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    const rateState = await resolveExchangeRate()
    if (!rateState.tradingEnabled || rateState.storedRate <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Trading is paused",
          details: rateState.message || "The rate will be posted soon. Please try again later.",
        },
        { status: 503 }
      )
    }

    const rateValue = Number.parseFloat(exchangeRate)
    if (!Number.isFinite(rateValue) || rateValue <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid exchange rate", details: "Refresh the page and try again." },
        { status: 400 }
      )
    }

    if (Math.abs(rateValue - rateState.storedRate) > 0.0001) {
      return NextResponse.json(
        {
          success: false,
          error: "Exchange rate changed",
          details: "Refresh the page to use the latest rate.",
        },
        { status: 409 }
      )
    }

    const ghsNum = Number.parseFloat(ghsAmount)
    const rmbNum = Number.parseFloat(rmbAmount)
    if (!Number.isFinite(ghsNum) || ghsNum <= 0 || !Number.isFinite(rmbNum) || rmbNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amounts", details: "GHS and RMB amounts must be positive numbers." },
        { status: 400 }
      )
    }

    let qrImage: Uint8Array | null = null
    let qrMime: string | null = null
    if (qrFile) {
      const buf = Buffer.from(await qrFile.arrayBuffer())
      qrMime =
        qrFile.type && qrFile.type.startsWith("image/") ? qrFile.type : "image/png"
      qrImage = new Uint8Array(buf)
    }

    await runMigrations()

    let referenceCode = generateReferenceCode()
    for (let attempt = 0; attempt < 10; attempt++) {
      if (!(await orderRepo.referenceCodeExists(referenceCode))) break
      referenceCode = generateReferenceCode()
    }

    const recordId = await orderRepo.createOrder({
      customerName: fullName.trim(),
      emailAddress: email.trim(),
      mobileNumber: mobileNumber.trim(),
      referralName: referralName?.toString().trim() || undefined,
      ghsAmount: ghsNum,
      rmbAmount: rmbNum,
      referenceCode,
      submittedAt: new Date().toISOString(),
      qrImage,
      qrMime,
      userId,
    })

    return NextResponse.json({
      success: true,
      referenceCode,
      recordId,
      message: "Transaction submitted successfully",
      qrStored: !!qrImage,
      linkedToUser: !!userId,
      userId,
      exchangeRate: rateValue,
      ghsAmount: ghsNum,
      rmbAmount: rmbNum,
    })
  } catch (error) {
    console.error("submit-transaction:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
