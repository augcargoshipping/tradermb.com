# Email Setup Guide for Password Reset

This guide will help you set up email functionality for the password reset feature.

## Option 1: Gmail Setup (Recommended for Development)

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-Factor Authentication if not already enabled

### 2. Generate App Password
- Go to Google Account → Security → 2-Step Verification
- Click on "App passwords"
- Select "Mail" and "Other (Custom name)"
- Name it "TRADE RMB Password Reset"
- Copy the generated 16-character password

### 3. Environment Variables
Add these to your `.env.local` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

## Option 2: Other Email Services

### For Outlook/Hotmail:
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-app-password
```

### For Yahoo:
```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

## Option 3: Custom SMTP Server

If you have your own SMTP server, update the transporter configuration in `app/api/auth/forgot-password/route.ts`:

```javascript
const transporter = nodemailer.createTransporter({
  host: "your-smtp-host.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

## Option 4: Email Service Providers

### SendGrid
```javascript
const transporter = nodemailer.createTransporter({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});
```

### Mailgun
```javascript
const transporter = nodemailer.createTransporter({
  host: "smtp.mailgun.org",
  port: 587,
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASSWORD,
  },
});
```

## Testing the Email Setup

1. Start your development server: `npm run dev`
2. Go to `/auth/forgot-password`
3. Enter a valid email address
4. Check if the email is sent successfully

## Troubleshooting

### Common Issues:

1. **Authentication failed**: Make sure you're using an app password, not your regular password
2. **Connection timeout**: Check your internet connection and firewall settings
3. **Email not received**: Check spam folder and email service settings

### For Development/Testing:

If you don't want to set up real email during development, you can:

1. Use a service like Mailtrap.io for testing
2. Log the reset link to console instead of sending email
3. Use a mock email service

## Security Notes

- Never commit email credentials to version control
- Use environment variables for all sensitive information
- Consider using a dedicated email service for production
- Implement rate limiting for password reset requests
- Set appropriate token expiration times

## Production Deployment

For production, consider using:
- SendGrid
- Mailgun
- Amazon SES
- Resend.com

These services provide better deliverability and monitoring than personal email accounts. 