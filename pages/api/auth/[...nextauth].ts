import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { airtableService } from "@/lib/airtable-service";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text", placeholder: "jsmith or jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;
        // Look up user by email or username in Airtable
        let users = await airtableService.getUsersByEmail(credentials.identifier);
        if (!users || users.length === 0) {
          users = await airtableService.getUsersByUsername(credentials.identifier);
        }
        if (!users || users.length === 0) return null;
        const user = users[0].fields;
        // Compare password
        const isValid = await bcrypt.compare(credentials.password, user.Password);
        if (!isValid) return null;
        // Return user object for session
        return {
          id: users[0].id,
          name: user.Full_Name,
          email: user.Email,
          image: user.Avatar_URL || null,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  }
});

export async function GET() {
  try {
    const rates = await airtableService.fetchAllRates();
    return NextResponse.json(rates);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
} 