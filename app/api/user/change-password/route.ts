import { NextRequest, NextResponse } from "next/server";
import { airtableService } from "@/lib/airtable-service";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword, userId } = await request.json();

    if (!currentPassword || !newPassword || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get user by User_ID
    const users = await airtableService.getUsersByEmail(userId); // This will be updated to use proper user lookup
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.fields.Password);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password in Airtable
    const success = await airtableService.updateUserProfile(user.id, {
      Password: hashedNewPassword
    });

    if (!success) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 