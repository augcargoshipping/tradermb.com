import { type NextRequest, NextResponse } from "next/server";
import { airtableService } from "@/lib/airtable-service";
import { v2 as cloudinary } from "cloudinary";


cloudinary.config({
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const fullName = formData.get("fullName") as string;
    const mobileNumber = formData.get("mobileNumber") as string;
    const referralName = formData.get("referralName") as string;
    const ghsAmount = formData.get("ghsAmount") as string;
    const rmbAmount = formData.get("rmbAmount") as string;
    const qrFile = formData.get("alipayQR") as File;

    if (!fullName || !mobileNumber || !ghsAmount || !qrFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upload QR to Cloudinary
    const cloudinaryUrl = await uploadQrToCloudinary(qrFile);
    if (!cloudinaryUrl) {
      return NextResponse.json({ error: "Failed to upload QR code" }, { status: 500 });
    }

    // Generate reference code
    const referenceCode = airtableService.generateReferenceCode(fullName);

    // Create Airtable record
    const recordData = {
      Customer_Name: fullName,
      Mobile_Number: mobileNumber,
      Referral_Name: referralName || undefined,
      GHS_Amount: parseFloat(ghsAmount),
      RMB_Amount: parseFloat(rmbAmount),
      Reference_Code: referenceCode,
      Submitted_At: new Date().toISOString(),
      QR_Code: [{ url: cloudinaryUrl }], // Airtable attachment field
    };

    const connectionTest = await airtableService.testConnection();
    if (!connectionTest) {
      return NextResponse.json({ error: "Airtable connection failed" }, { status: 500 });
    }

    const recordId = await airtableService.createRecord(recordData);
    if (!recordId) {
      return NextResponse.json({ error: "Failed to create Airtable record" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      referenceCode,
      recordId,
      message: "Transaction submitted successfully",
    });

  } catch (error) {
  console.error("💥 Full error details:", error);
  if (error instanceof Error) {
    console.error("💥 Error message:", error.message);
    console.error("💥 Error stack:", error.stack);
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

}

async function uploadQrToCloudinary(file: File): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: "alipay_qr_codes" },
        (err, result) => {
          if (err || !result) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
      upload.end(buffer);
    });

    // @ts-ignore
    return result.secure_url as string;
  } catch (err) {
    console.error("❌ Cloudinary upload failed", err);
    return null;
  }
}
