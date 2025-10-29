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
        if (isDev) console.log('🔐 NextAuth authorize called', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          if (isDev) console.log('❌ Missing credentials')
          throw new Error('Credentials are required')
        }

        try {
          // Skip security check for now to avoid blocking logins
          // const securityCheck = await validateLoginAttempt(
          //   credentials.email,
          //   credentials.password,
          //   'unknown'
          // )
          // if (!securityCheck.isValid) {
          //   console.log('🚫 Security check failed:', securityCheck.lockoutReason)
          //   return null
          // }

          // For students, allow student ID login (format: STU2024001)
          // For other roles, allow email login
          let user: any = null
          
          if (credentials.email.toUpperCase().includes('STU')) {
            // If it contains 'STU', it's likely a student ID (format: STU2024001)
            // Convert to uppercase to handle case sensitivity
            const studentId = credentials.email.toUpperCase().trim()
            
            if (isDev) console.log('🔍 Looking for student with ID:', studentId)
            
            // Find user by student profile
            const studentProfile = await prisma.studentProfile.findUnique({
              where: { studentId: studentId },
              include: { user: true }
            })
            
            if (studentProfile && studentProfile.user) {
              user = studentProfile.user
              // Add studentId to user object for session
              (user as any).studentId = studentProfile.studentId
              if (isDev) console.log('✅ Student found:', user.email)
            } else {
              if (isDev) console.log('❌ Student profile not found for:', studentId)
            }
          } else {
            // For non-students (admin, lecturer), use email (case insensitive)
            const email = credentials.email.toLowerCase().trim()
            if (isDev) console.log('🔍 Looking for user with email:', email)
            
            user = await prisma.user.findFirst({
              where: {
                email: email,
                role: { not: 'STUDENT' }
              }
            })
            
            if (user) {
              if (isDev) console.log('✅ User found:', user.email, user.role)
            } else {
              // Also try to find student by email as fallback
              const emailUser = await prisma.user.findFirst({
                where: {
                  email: email,
                  role: 'STUDENT'
                },
                include: {
                  studentProfile: true
                }
              })
              
              if (emailUser) {
                user = emailUser
                if (emailUser.studentProfile) {
                  (user as any).studentId = emailUser.studentProfile.studentId
                }
                if (isDev) console.log('✅ Student found by email:', user.email)
              } else {
                if (isDev) console.log('❌ No user found with email:', email)
              }
            }
          }

          if (isDev) console.log('👤 User lookup result:', { found: !!user, hasPassword: !!user?.passwordHash })

          if (!user) {
            if (isDev) console.log('❌ User not found')
            throw new Error('Invalid credentials')
          }
          
          if (!user.passwordHash) {
            if (isDev) console.log('❌ User has no password hash')
            throw new Error('Account not properly set up. Please contact administrator.')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (isDev) console.log('🔑 Password validation result:', isPasswordValid)

          if (!isPasswordValid) {
            if (isDev) console.log('❌ Invalid password')
            // Track failed login attempt (non-blocking)
            try {
              await trackLoginAttempt({
                email: credentials.email,
                timestamp: new Date(),
                success: false,
                ipAddress: 'unknown',
                userAgent: 'Unknown'
              })
            } catch (trackError) {
              console.warn('Failed to track login attempt:', trackError)
            }
            throw new Error('Invalid credentials')
          }

          // Check if user is active
          if (!user.isActive) {
            if (isDev) console.log('❌ User account is inactive')
            throw new Error('Your account has been deactivated. Please contact administrator.')
          }

          // Track successful login attempt (non-blocking)
          try {
            await trackLoginAttempt({
              email: credentials.email,
              timestamp: new Date(),
              success: true,
              ipAddress: 'unknown',
              userAgent: 'Unknown'
            })
          } catch (trackError) {
            console.warn('Failed to track login attempt:', trackError)
          }

          if (isDev) console.log('✅ Authentication successful for:', user.email, user.role)
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            studentId: (user as any).studentId || null,
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          // Return a proper error instead of null to show better error messages
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Authentication failed')
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
    maxAge: 4 * 60 * 60, // 4 hours (security improvement)
  },
  jwt: {
    maxAge: 4 * 60 * 60, // 4 hours (security improvement)
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.studentId = user.studentId
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
        session.user.studentId = token.studentId as string
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
