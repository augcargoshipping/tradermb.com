import { NextResponse } from "next/server"

export async function GET() {
  const secret = process.env.CLOUDINARY_API_SECRET;
  
  return NextResponse.json({
    secretExists: !!secret,
    secretLength: secret ? secret.length : 0,
    secretFirstChars: secret ? secret.substring(0, 5) : 'NONE',
    secretLastChars: secret ? secret.substring(secret.length - 5) : 'NONE',
    message: secret ? `API Secret loaded successfully (${secret.length} characters)` : 'API Secret not loaded'
  })
} 