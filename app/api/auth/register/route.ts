import { NextRequest, NextResponse } from "next/server";
import { airtableService } from "@/lib/airtable-service";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { fullName, username, email, phone, password } = await request.json();

    // Validation
    if (!fullName || !username || !email || !phone || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user already exists
    const existingUsers = await airtableService.getUsersByEmail(email);
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const existingUsername = await airtableService.getUsersByUsername(username);
    if (existingUsername && existingUsername.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // Create user record in Airtable
    const userData = {
      Full_Name: fullName,
      Username: username,
      Email: email,
      Phone: phone,
      Password: hashedPassword,
      Status: "active"
    };

    const recordId = await airtableService.createUserRecord(userData);
    
    if (!recordId) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      userId: recordId
    });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 