import { NextRequest, NextResponse } from "next/server";
import { airtableService } from "@/lib/airtable-service";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Configure email transporter with better error handling
let transporter: any = null;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
      },
      // Add additional options for better reliability
      secure: true,
      port: 465,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Test the connection
    transporter.verify(function(error: any, success: any) {
      if (error) {
        console.log("❌ Email server connection failed:", error.message);
        transporter = null; // Disable email sending if connection fails
      } else {
        console.log("✅ Email server is ready to send messages");
      }
    });
  }
} catch (error) {
  console.log("❌ Email configuration error:", error);
  transporter = null;
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

    // Store reset token in Airtable
    const updateSuccess = await airtableService.updateUserProfile(userId, {
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry.toString(), // Store as string timestamp
    });

    if (!updateSuccess) {
      return NextResponse.json({ error: "Failed to generate reset token" }, { status: 500 });
    }

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

    // Send email if transporter is configured and working
    if (transporter) {
      try {
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
        
        return NextResponse.json({ 
          success: true, 
          message: "Password reset link sent to your email" 
        });
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        // Fall back to console output if email fails
        console.log("📧 EMAIL SENDING FAILED - Password reset link for development:");
        console.log("🔗 Reset URL:", resetUrl);
        console.log("📧 Email would be sent to:", email);
        
        return NextResponse.json({ 
          success: true, 
          message: "Password reset link generated (check console for development - email service unavailable)",
          development: {
            resetUrl,
            email,
            note: "Email service is not working. Use the reset URL from the console for testing."
          }
        });
      }
    } else {
      // Fallback for development/testing when email is not configured
      console.log("📧 EMAIL NOT CONFIGURED - Password reset link for development:");
      console.log("🔗 Reset URL:", resetUrl);
      console.log("📧 Email would be sent to:", email);
      
      return NextResponse.json({ 
        success: true, 
        message: "Password reset link generated (check console for development)",
        development: {
          resetUrl,
          email,
          note: "Email service is not configured. Use the reset URL from the console for testing."
        }
      });
    }

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ 
      error: "Failed to process password reset request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 