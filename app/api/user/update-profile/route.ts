import { NextRequest, NextResponse } from "next/server";
import { airtableService } from "@/lib/airtable-service";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, updates } = await request.json();

    if (!userId || !updates) {
      return NextResponse.json({ error: "User ID and updates are required" }, { status: 400 });
    }

    // Get user by User_ID
    const users = await airtableService.getUsersByEmail(userId); // This will be updated to use proper user lookup
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    // Update user profile in Airtable
    const success = await airtableService.updateUserProfile(user.id, updates);

    if (!success) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 