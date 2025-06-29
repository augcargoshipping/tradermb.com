import { type NextRequest, NextResponse } from "next/server";
import { airtableService } from "@/lib/airtable-service";
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create authOptions inline to avoid import issues
const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await airtableService.getUserByEmailOrUsername(credentials.email);
          if (!user) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.fields.Password);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.fields.Email,
            name: user.fields.Full_Name,
            username: user.fields.Username,
            phone: user.fields.Phone,
            image: user.fields.Avatar_URL,
            userId: user.fields.User_ID,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.phone = user.phone;
        token.userId = user.userId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.phone = token.phone as string;
        session.user.userId = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
};

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting transaction submission...")
    const formData = await request.formData();

    // Get user session if available
    const session = await getServerSession(authOptions);
    const userId = session?.user?.userId;

    // Extract form fields
    const fullName = formData.get("fullName") as string;
    const mobileNumber = formData.get("mobileNumber") as string;
    const referralName = formData.get("referralName") as string;
    const ghsAmount = formData.get("ghsAmount") as string;
    const rmbAmount = formData.get("rmbAmount") as string;
    const qrFile = formData.get("alipayQR") as File;

    console.log("📝 Form data received:", {
      fullName: !!fullName,
      mobileNumber: !!mobileNumber,
      ghsAmount: !!ghsAmount,
      qrFile: !!qrFile,
      qrFileSize: qrFile?.size,
      qrFileName: qrFile?.name,
      userId: userId || "Not logged in"
    });

    if (!fullName || !mobileNumber || !ghsAmount || !qrFile) {
      console.log("❌ Missing required fields:", { fullName: !!fullName, mobileNumber: !!mobileNumber, ghsAmount: !!ghsAmount, qrFile: !!qrFile });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upload file to Cloudinary and get URL
    let qrFileUrl = null;
    if (qrFile) {
      try {
        console.log("📤 Uploading QR file to Cloudinary...");
        console.log("📁 File details:", { name: qrFile.name, size: qrFile.size, type: qrFile.type });
        
        // Convert file to buffer
        const arrayBuffer = await qrFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'rmb-trade/qr-codes',
              resource_type: 'auto',
              allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) {
                console.error("❌ Cloudinary upload error:", error);
                reject(error);
              } else {
                console.log("✅ Cloudinary upload successful:", result);
                resolve(result);
              }
            }
          ).end(buffer);
        });
        
        qrFileUrl = (uploadResult as any).secure_url;
        console.log("✅ QR file uploaded to Cloudinary:", qrFileUrl);
      } catch (error) {
        console.error("❌ Failed to upload QR file:", error);
        return NextResponse.json({ 
          error: "Failed to upload QR code",
          details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
      }
    }

    // Generate reference code
    const referenceCode = airtableService.generateReferenceCode(fullName);
    console.log("🔢 Generated reference code:", referenceCode);

    // Create Airtable record with file URL
    const recordData = {
      Customer_Name: fullName,
      Mobile_Number: mobileNumber,
      Referral_Name: referralName || undefined,
      GHS_Amount: parseFloat(ghsAmount),
      RMB_Amount: parseFloat(rmbAmount),
      Reference_Code: referenceCode,
      Submitted_At: new Date().toISOString(),
      ...(qrFileUrl && {
        QR_CODE: qrFileUrl, // Store the Cloudinary URL as text
      }),
      ...(userId && {
        user_id: userId, // Link transaction to user if logged in
      }),
    };

    console.log("📊 Creating Airtable record...");
    console.log("📋 Record data keys:", Object.keys(recordData));
    console.log("🔗 User linking:", userId ? `Linked to user: ${userId}` : "No user linked");
    
    const connectionTest = await airtableService.testConnection();
    if (!connectionTest) {
      console.log("❌ Airtable connection failed");
      return NextResponse.json({ error: "Airtable connection failed" }, { status: 500 });
    }

    const recordId = await airtableService.createRecord(recordData);
    if (!recordId) {
      console.log("❌ Failed to create Airtable record");
      return NextResponse.json({ error: "Failed to create Airtable record" }, { status: 500 });
    }

    console.log("✅ Transaction completed successfully:", recordId);
    return NextResponse.json({
      success: true,
      referenceCode,
      recordId,
      message: "Transaction submitted successfully",
      qrUploaded: !!qrFileUrl,
      qrUrl: qrFileUrl,
      linkedToUser: !!userId,
      userId: userId
    });

  } catch (error) {
    console.error("💥 Full error details:", error);
    if (error instanceof Error) {
      console.error("💥 Error message:", error.message);
      console.error("💥 Error stack:", error.stack);
    }
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
