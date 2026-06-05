import { NextResponse } from "next/server"
import { airtableService } from "@/lib/airtable-service"
import { getAuthSession } from "@/lib/auth-server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.airtableId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const success = await airtableService.updateUserProfile(session.user.airtableId, {
      Status: "inactive",
    })

    if (!success) {
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Account deactivated" })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
