import { NextResponse } from "next/server"

export async function GET() {
  const cloudinarySecret = process.env.CLOUDINARY_API_SECRET;
  
  return NextResponse.json({
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? '✓ SET' : '✗ NOT SET',
      apiKey: process.env.CLOUDINARY_API_KEY ? '✓ SET' : '✗ NOT SET',
      apiSecret: cloudinarySecret ? '✓ SET' : '✗ NOT SET',
      apiSecretLength: cloudinarySecret ? cloudinarySecret.length : 0,
      apiSecretStartsWith: cloudinarySecret ? cloudinarySecret.substring(0, 3) : 'N/A',
    },
    airtable: {
      baseId: process.env.AIRTABLE_BASE_ID ? '✓ SET' : '✗ NOT SET',
      token: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN ? '✓ SET' : '✗ NOT SET',
    },
    fileCheck: {
      envLocalExists: 'Check manually - file should be in project root',
      envLocalFormat: 'Should be: KEY=value (no spaces around =)',
    }
  })
} 