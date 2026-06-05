import { NextRequest, NextResponse } from "next/server"
import { airtableService } from "@/lib/airtable-service"
import { getAuthSession } from "@/lib/auth-server"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.airtableId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
    }

    const record = await airtableService.getUserByRecordId(session.user.airtableId)
    if (!record?.fields?.Password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isValidPassword = await bcrypt.compare(currentPassword, record.fields.Password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12)
    const success = await airtableService.updateUserProfile(session.user.airtableId, {
      Password: hashedNewPassword,
    })

    if (!success) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
