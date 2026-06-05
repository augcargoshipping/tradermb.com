import type { NextApiRequest, NextApiResponse } from "next";
import { airtableService } from "@/lib/airtable-service";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { fullName, username, email, phone, password, referralName } = req.body;
  if (!fullName || !username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedUsername = String(username).trim();

  if (!airtableService.isConfigured()) {
    return res.status(503).json({
      error:
        "Sign-up is not connected to Airtable yet. Add AIRTABLE_BASE_ID and AIRTABLE_PERSONAL_ACCESS_TOKEN to .env.local, then restart the dev server.",
      code: "AIRTABLE_NOT_CONFIGURED",
    });
  }

  // Check if user already exists (by email or username)
  const existingByEmail = await airtableService.getUsersByEmail(normalizedEmail);
  const existingByUsername = await airtableService.getUsersByUsername(normalizedUsername);
  if ((existingByEmail && existingByEmail.length > 0) || (existingByUsername && existingByUsername.length > 0)) {
    return res.status(409).json({ error: "User already exists" });
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  // Create user in Airtable
  try {
    await airtableService.createUserRecord({
      Full_Name: String(fullName).trim(),
      Username: normalizedUsername,
      Email: normalizedEmail,
      Phone: phone || "",
      Referral_Name: referralName || "",
      Password: hashedPassword,
    });
    return res.status(201).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Register error:", message);

    if (message.includes("AIRTABLE_NOT_CONFIGURED")) {
      return res.status(503).json({
        error:
          "Sign-up is not connected to Airtable yet. Add AIRTABLE_BASE_ID and AIRTABLE_PERSONAL_ACCESS_TOKEN to .env.local, then restart the dev server.",
        code: "AIRTABLE_NOT_CONFIGURED",
      });
    }
    if (message.includes("404") || /not found/i.test(message)) {
      return res.status(503).json({
        error:
          "Could not reach your Airtable USERS table. Check the base ID, token permissions, and that the table is named USERS.",
        code: "AIRTABLE_TABLE_NOT_FOUND",
      });
    }
    if (/unknown field|invalid value for column/i.test(message)) {
      return res.status(400).json({
        error:
          "Airtable field mismatch. Ensure the USERS table has: Full_Name, Username, Email, Phone, Password, User_ID, Status (and optional Referral_Name).",
        code: "AIRTABLE_FIELD_ERROR",
      });
    }

    return res.status(500).json({
      error: "Failed to register user. Open /api/test-airtable in the browser to diagnose the connection.",
    });
  }
} 