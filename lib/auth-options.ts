import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { airtableService } from "@/lib/airtable-service"

/** Stay signed in until explicit sign-out; rolling refresh keeps active users logged in. */
const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60
const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null
        }

        const record = await airtableService.getUserByEmailOrUsername(credentials.identifier)
        if (!record?.fields) {
          return null
        }

        const fields = record.fields as {
          Full_Name?: string
          Email?: string
          Password?: string
          Avatar_URL?: string
          User_ID?: string
          Status?: string
        }

        if (fields.Status === "inactive") {
          return null
        }

        const storedPassword = fields.Password
        if (!storedPassword || typeof storedPassword !== "string") {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, storedPassword)
        if (!isValid) {
          return null
        }

        return {
          id: record.id,
          airtableId: record.id,
          name: fields.Full_Name ?? "",
          email: fields.Email ?? "",
          image: fields.Avatar_URL ?? null,
          userId: fields.User_ID || record.id,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.airtableId = user.airtableId ?? user.id
        token.userId = user.userId ?? user.id
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? token.airtableId ?? "")
        session.user.airtableId = token.airtableId as string | undefined
        session.user.userId = (token.userId as string | undefined) ?? session.user.id
        if (token.name) session.user.name = token.name as string
        if (token.email) session.user.email = token.email as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
