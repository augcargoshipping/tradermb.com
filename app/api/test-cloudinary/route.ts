import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    console.log("🧪 Testing Cloudinary configuration...")
    
    // Test configuration
    const config = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
    }
    
    console.log("📋 Cloudinary config:", config)
    
    // Test account access
    const accountInfo = await cloudinary.api.ping()
    console.log("✅ Cloudinary ping successful:", accountInfo)
    
    return NextResponse.json({
      success: true,
      message: "Cloudinary is working correctly",
      config: {
        cloudName: !!config.cloudName,
        apiKey: !!config.apiKey,
        apiSecret: config.apiSecret === 'SET'
      },
      ping: accountInfo
    })
    
  } catch (error) {
    console.error("❌ Cloudinary test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      config: {
        cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: !!process.env.CLOUDINARY_API_KEY,
        apiSecret: !!process.env.CLOUDINARY_API_SECRET
      }
    })
  }
} 