import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { airtableService } from "@/lib/airtable-service"
import bcrypt from "bcryptjs"

// Debug logging to see what's happening
console.log('🔍 NextAuth Configuration Debug:')
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET')
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
console.log('NODE_ENV:', process.env.NODE_ENV)

// Determine the base URL
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NODE_ENV === 'production') return 'https://www.tradermb.com'
  return 'http://localhost:3000'
}

// Ensure we have a secret - this is critical for JWT encryption
const getSecret = () => {
  if (process.env.NEXTAUTH_SECRET) {
    console.log('✅ Using NEXTAUTH_SECRET from environment')
    return process.env.NEXTAUTH_SECRET
  }
  
  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ Using development fallback secret')
    return 'dev-secret-key-change-in-production'
  }
  
  // For production, we need a proper secret
  console.error('❌ NEXTAUTH_SECRET is not set in production!')
  return 'fallback-secret-key-change-this-immediately'
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
        console.log('🔐 Attempting authentication for:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null;
        }

        try {
          // Get user by email or username
          const user = await airtableService.getUserByEmailOrUsername(credentials.email);

          if (!user) {
            console.log('❌ User not found:', credentials.email)
            return null;
          }

          console.log('✅ User found:', user.fields.Email)

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.fields.Password);

          if (!isValidPassword) {
            console.log('❌ Invalid password for:', credentials.email)
            return null;
          }

          console.log('✅ Authentication successful for:', credentials.email)

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
          console.error("❌ Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('🔑 Creating JWT for user:', user.email)
        token.id = user.id;
        token.username = user.username;
        token.phone = user.phone;
        token.userId = user.userId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        console.log('📋 Creating session for user ID:', token.id)
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.phone = token.phone as string;
        session.user.userId = token.userId as string;
      }
      return session;
    }
  },
  secret: getSecret(),
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  debug: true, // Enable debug mode to see what's happening
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