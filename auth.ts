import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { airtableService } from "@/lib/airtable-service"
import bcrypt from "bcryptjs"

// Determine the base URL
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NODE_ENV === 'production') return 'https://www.tradermb.com'
  return 'http://localhost:3000'
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get user by email or username
          const user = await airtableService.getUserByEmailOrUsername(credentials.email);

          if (!user) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.fields.Password);

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.fields.Email,
            name: user.fields.Full_Name,
            username: user.fields.Username,
            phone: user.fields.Phone,
            image: user.fields.Avatar_URL,
            userId: user.fields.User_ID,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.phone = user.phone;
        token.userId = user.userId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.phone = token.phone as string;
        session.user.userId = token.userId as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  // Explicitly set the URL to suppress the warning
  url: getBaseUrl(),
  // Handle dynamic URLs for different environments
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
})

export { handler as GET, handler as POST }
export const { auth, signIn, signOut } = handler 