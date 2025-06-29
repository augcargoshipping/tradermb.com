# Cloudinary Setup Guide

This guide will help you set up Cloudinary for file uploads in your RMB trade application.

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up For Free"
3. Fill in your details and create an account
4. Verify your email address

## Step 2: Get Your Credentials

1. After logging in, you'll see your **Dashboard**
2. Copy these values from your dashboard:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

## Step 3: Add Environment Variables

Add these to your `.env.local` file (replace with your actual values):

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Step 4: Test the Setup

1. Start your development server: `npm run dev`
2. Try submitting a transaction with a QR code image
3. Check the browser console and server logs for any errors
4. Verify the file appears in your Cloudinary Media Library

## Troubleshooting

### Common Issues:

1. **"Invalid credentials" error**: Check your environment variables
2. **"File too large" error**: Cloudinary free tier has 10MB limit per file
3. **"Upload failed" error**: Check your internet connection
4. **Files not appearing**: Check the Cloudinary Media Library

### Cloudinary Free Tier Limits:
- **25GB storage**
- **25GB bandwidth per month**
- **10MB file size limit per upload**
- **25GB monthly upload quota**

### File Organization:
- Files are stored in the `rmb-trade/qr-codes/` folder
- Each file gets a unique timestamp-based filename
- Public URLs are generated automatically
- Images are optimized automatically

## Benefits of Cloudinary:

1. **Generous free tier**: 25GB storage and bandwidth
2. **Image optimization**: Automatic compression and format conversion
3. **CDN delivery**: Fast global access
4. **Airtable compatible**: Public URLs work perfectly
5. **Reliable**: Used by millions of developers

## Security Notes:

- Keep your API secret secure
- Don't commit `.env.local` to version control
- Consider using signed uploads for production

## Next Steps:

Once Cloudinary is set up, your application will:
1. Upload QR code images to Cloudinary
2. Optimize images automatically
3. Store the public URL in Airtable
4. Provide fast CDN access to images

The QR code URLs will be accessible to anyone with the link, making them perfect for Airtable integration and sharing with customers.

## Testing Your Setup:

Run this command to test your Cloudinary configuration:

```bash
node scripts/test-cloudinary.js
```

This will verify that your credentials are working correctly. 