import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { validateLoginAttempt, trackLoginAttempt } from '@/lib/account-security'
import { prisma } from './prisma'
import { UserRole } from '@/types'

const isDev = process.env.NODE_ENV === 'development'

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Disabled for credentials provider
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (isDev) console.log('🔐 NextAuth authorize called')
        
        if (!credentials?.email || !credentials?.password) {
          if (isDev) console.log('❌ Missing credentials')
          return null
        }

        try {
          // Validate login attempt for security
          const securityCheck = await validateLoginAttempt(
            credentials.email,
            credentials.password,
            'unknown' // IP address should be passed from request
          )

          if (!securityCheck.isValid) {
            console.log('🚫 Security check failed:', securityCheck.lockoutReason)
            return null
          }

          // For students, only allow index number login
          // For other roles, allow email login
          let user
          if (credentials.email.includes('/')) {
            // If it contains '/', it's likely an index number (format: CS/ITC/21/0001)
            // Convert to uppercase to handle case sensitivity
            const indexNumber = credentials.email.toUpperCase()
            user = await prisma.user.findFirst({
              where: {
                indexNumber: indexNumber,
                role: 'STUDENT'
              }
            })
          } else {
            // For non-students (admin, lecturer), use email (case insensitive)
            user = await prisma.user.findFirst({
              where: {
                email: credentials.email,
                role: { not: 'STUDENT' }
              }
            })
          }

          if (isDev) console.log('👤 User found:', !!user)

          if (!user || !user.passwordHash) {
            if (isDev) console.log('❌ User not found or no password hash')
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (isDev) console.log('🔑 Password valid:', isPasswordValid)

          if (!isPasswordValid) {
            if (isDev) console.log('❌ Invalid password')
            // Track failed login attempt
            await trackLoginAttempt({
              email: credentials.email,
              timestamp: new Date(),
              success: false,
              ipAddress: 'unknown',
              userAgent: 'Unknown'
            })
            return null
          }

          // Track successful login attempt
          await trackLoginAttempt({
            email: credentials.email,
            timestamp: new Date(),
            success: true,
            ipAddress: 'unknown',
            userAgent: 'Unknown'
          })

          if (isDev) console.log('✅ Authentication successful')
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            indexNumber: user.indexNumber,
          }
        } catch (error) {
          console.error('❌ Auth error')
          return null
        }
      }
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          })
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.indexNumber = user.indexNumber
        token.image = user.image
      }
      
      // Handle session updates (like profile image changes)
      if (trigger === 'update' && session) {
        if (session.image) {
          token.image = session.image
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.indexNumber = token.indexNumber as string
        session.user.image = token.image as string
      }
      if (isDev) console.log('🔐 Session callback:', { session, token })
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async signIn({ user, account, profile }) {
      if (isDev) console.log('🔐 SignIn callback:', { user, account })
      return true
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  debug: isDev,
}
