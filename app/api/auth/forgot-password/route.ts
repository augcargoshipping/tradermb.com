import { NextRequest, NextResponse } from "next/server";
import { airtableService } from "@/lib/airtable-service";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Configure email transporter (you'll need to set up your email service)
let transporter: any = null;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: "gmail", // or your preferred email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
      },
    });
  }
} catch (error) {
  console.log("Email configuration not set up, using console fallback");
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const users = await airtableService.getUsersByEmail(email);
    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: "If an account with this email exists, a reset link has been sent." 
      });
    }

    const user = users[0];
    const userId = user.id;

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now as timestamp

    // Store reset token in Airtable (you might want to create a separate table for this)
    // For now, we'll store it in the user record
    const updateSuccess = await airtableService.updateUserProfile(userId, {
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry.toString(), // Store as string timestamp
    });

    if (!updateSuccess) {
      return NextResponse.json({ error: "Failed to generate reset token" }, { status: 500 });
    }

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    // Send email if transporter is configured, otherwise log to console
    if (transporter) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "TRADE RMB - Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">TRADE RMB</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
              <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
                You requested a password reset for your TRADE RMB account. Click the button below to reset your password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block; 
                          font-weight: 600;">
                  Reset Password
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
              </p>
            </div>
            <div style="background: #f3f4f6; padding: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © 2024 TRADE RMB. All rights reserved.
              </p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Password reset email sent to:", email);
    } else {
      // Fallback for development/testing
      console.log("📧 EMAIL NOT CONFIGURED - Password reset link for development:");
      console.log("🔗 Reset URL:", resetUrl);
      console.log("📧 Email would be sent to:", email);
    }

    return NextResponse.json({ 
      success: true, 
      message: transporter 
        ? "Password reset link sent to your email" 
        : "Password reset link generated (check console for development)"
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ 
      error: "Failed to process password reset request" 
    }, { status: 500 });
  }
} 