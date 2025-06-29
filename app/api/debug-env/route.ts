import { NextResponse } from "next/server"

export async function GET() {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  return NextResponse.json({
    apiSecretExists: !!apiSecret,
    apiSecretLength: apiSecret ? apiSecret.length : 0,
    apiSecretFirstChars: apiSecret ? apiSecret.substring(0, 4) + '...' : 'null',
    apiSecretLastChars: apiSecret ? '...' + apiSecret.substring(apiSecret.length - 4) : 'null',
    allEnvVars: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET',
    }
  })
} 