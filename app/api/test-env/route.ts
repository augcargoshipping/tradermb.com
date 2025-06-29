import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    cloudinary: {
      cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: !!process.env.CLOUDINARY_API_KEY,
      apiSecret: !!process.env.CLOUDINARY_API_SECRET,
    },
    airtable: {
      baseId: !!process.env.AIRTABLE_BASE_ID,
      token: !!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
    },
    nodeEnv: process.env.NODE_ENV,
  })
} 