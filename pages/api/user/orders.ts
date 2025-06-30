import type { NextApiRequest, NextApiResponse } from "next";
import { airtableService } from "@/lib/airtable-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Missing or invalid email" });
  }
  try {
    // Find user by email
    const users = await airtableService.getUsersByEmail(email);
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users[0].fields;
    // Fetch orders for this user
    const orders = await airtableService.getUserOrders(user.User_ID || user.Username || user.Email);
    return res.status(200).json({ orders });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
} 