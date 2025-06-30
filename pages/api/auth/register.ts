import type { NextApiRequest, NextApiResponse } from "next";
import { airtableService } from "@/lib/airtable-service";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  // Check if user already exists
  const existing = await airtableService.getUsersByEmail(email);
  if (existing && existing.length > 0) {
    return res.status(409).json({ error: "User already exists" });
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  // Create user in Airtable
  try {
    await airtableService.createUserRecord({
      Full_Name: fullName,
      Username: email,
      Email: email,
      Phone: "",
      Password: hashedPassword,
    });
    return res.status(201).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to register user" });
  }
} 