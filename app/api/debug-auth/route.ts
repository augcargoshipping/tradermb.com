import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envInfo = {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_DEBUG: process.env.NEXTAUTH_DEBUG,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      timestamp: new Date().toISOString(),
    }

    console.log('🔍 Debug Auth Environment:', envInfo)

    return NextResponse.json({
      status: 'success',
      environment: envInfo,
      message: 'NextAuth debug information'
    })
  } catch (error) {
    console.error('❌ Debug auth error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
} 