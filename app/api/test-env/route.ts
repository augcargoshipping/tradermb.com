import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envVars = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_DEBUG: process.env.NEXTAUTH_DEBUG,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? 'SET' : 'NOT SET',
      AIRTABLE_PERSONAL_ACCESS_TOKEN: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN ? 'SET' : 'NOT SET',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET',
      timestamp: new Date().toISOString(),
      message: 'Environment variables check'
    }

    console.log('🔍 Environment Variables:', envVars)

    return NextResponse.json(envVars)
  } catch (error) {
    console.error('❌ Environment test error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
} 