import { NextRequest, NextResponse } from "next/server";
import { getAirtableClient } from "@/lib/airtable-service";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "User ID, current password, and new password are required" },
        { status: 400 }
      );
    }

    const airtable = getAirtableClient();
    const base = airtable.base(process.env.AIRTABLE_BASE_ID!);

    // Get current user record
    const records = await base("Users").select({
      filterByFormula: `RECORD_ID() = '${userId}'`,
    }).all();

    if (records.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = records[0];
    const hashedPassword = user.fields.Password;

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, hashedPassword);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in Airtable
    const updatedRecords = await base("Users").update([
      {
        id: userId,
        fields: {
          Password: hashedNewPassword,
        },
      },
    ]);

    if (updatedRecords.length === 0) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
} 