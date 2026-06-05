import { NextRequest, NextResponse } from "next/server"
import { airtableService } from "@/lib/airtable-service"
import { getAuthSession } from "@/lib/auth-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.airtableId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim() : ""

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const existing = await airtableService.getUsersByEmail(email)
    const takenByOther = existing.some((r) => r.id !== session.user.airtableId)
    if (takenByOther) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const success = await airtableService.updateUserProfile(session.user.airtableId, {
      Full_Name: name,
      Email: email,
    })

    if (!success) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
