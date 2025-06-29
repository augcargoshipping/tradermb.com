import { NextRequest, NextResponse } from "next/server";
import { getAirtableClient } from "@/lib/airtable-service";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const profileImage = formData.get("profileImage") as File | null;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const airtable = getAirtableClient();
    const base = airtable.base(process.env.AIRTABLE_BASE_ID!);

    // Prepare update data
    const updateData: any = {
      Name: name,
      Email: email,
      Phone: phone,
      Address: address,
    };

    // Handle profile image upload if provided
    if (profileImage) {
      try {
        // Convert file to base64
        const bytes = await profileImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64String = buffer.toString("base64");
        const dataURI = `data:${profileImage.type};base64,${base64String}`;

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
          folder: "rmb-trade/profiles",
          public_id: `profile_${userId}`,
          overwrite: true,
        });

        updateData.Profile_Image = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload profile image" },
          { status: 500 }
        );
      }
    }

    // Update user record in Airtable
    const records = await base("Users").update([
      {
        id: userId,
        fields: updateData,
      },
    ]);

    if (records.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updatedUser = records[0];

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.fields.Name,
        email: updatedUser.fields.Email,
        username: updatedUser.fields.Username,
        phone: updatedUser.fields.Phone,
        address: updatedUser.fields.Address,
        image: updatedUser.fields.Profile_Image,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
} 