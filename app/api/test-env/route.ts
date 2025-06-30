import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    NEXTAUTH_DEBUG: process.env.NEXTAUTH_DEBUG,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    message: 'Environment variables check'
  })
} 