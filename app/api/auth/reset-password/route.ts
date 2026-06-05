import { NextRequest, NextResponse } from "next/server";
import { airtableService } from "@/lib/airtable-service";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // Find user with this reset token
    const users = await airtableService.getUsersByResetToken(token);
    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const user = users[0];
    const userId = user.id;

    // Check if token is expired
    const resetTokenExpiry = parseInt(user.fields.reset_token_expiry);
    if (resetTokenExpiry < Date.now()) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password and clear reset token
    const updateSuccess = await airtableService.updateUserProfile(userId, {
      Password: hashedPassword,
      reset_token: undefined,
      reset_token_expiry: undefined,
    });

    if (!updateSuccess) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Password reset successfully" 
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ 
      error: "Failed to reset password" 
    }, { status: 500 });
  }
} 