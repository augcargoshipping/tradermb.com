# Email Setup for Forgot Password Functionality

## Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to your Google Account settings
2. Navigate to Security
3. Under "2-Step Verification", click on "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Enter "TRADE RMB" as the name
6. Click "Generate"
7. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update Environment Variables
Add these to your `.env.local` file:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

### Step 4: Test the Setup
1. Restart your development server
2. Try the forgot password functionality
3. Check the console for email status messages

## Alternative Email Services

### Option 1: Use a Different Email Service
You can modify the email configuration in `app/api/auth/forgot-password/route.ts`:

```typescript
transporter = nodemailer.createTransporter({
  service: "outlook", // or "yahoo", "hotmail", etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

### Option 2: Use a Transactional Email Service
For production, consider using services like:
- SendGrid
- Mailgun
- AWS SES
- Resend

## Troubleshooting

### Common Gmail Issues:
1. **"Username and Password not accepted"**
   - Make sure you're using an App Password, not your regular password
   - Ensure 2-Factor Authentication is enabled
   - Check that the email and password are correct

2. **"Less secure app access"**
   - This setting is deprecated, use App Passwords instead

3. **"Connection timeout"**
   - Check your internet connection
   - Try using port 587 instead of 465

### Development Fallback:
If email setup fails, the system will:
1. Generate the reset token
2. Store it in Airtable
3. Log the reset URL to the console
4. Return a success message with development information

## Testing the Forgot Password Flow

1. **Start the development server**
2. **Go to the forgot password page**
3. **Enter your email address**
4. **Check the console for the reset URL**
5. **Copy the URL and open it in your browser**
6. **Set a new password**

The reset URL will look like:
```
http://localhost:3000/auth/reset-password?token=abc123...
```

## Production Deployment

For production, make sure to:
1. Set up proper email credentials
2. Use a reliable email service
3. Test the email functionality thoroughly
4. Monitor email delivery rates
5. Set up proper error handling and logging 