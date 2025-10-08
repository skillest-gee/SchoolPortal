const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testAuth() {
  try {
    console.log('🔍 Testing authentication logic...')
    
    const email = 'admin@school.edu'
    const password = 'admin123'
    
    console.log('📧 Looking for user with email:', email)
    
    // Test the exact query from auth.ts
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        role: { not: 'STUDENT' }
      }
    })
    
    console.log('👤 User found:', user ? 'YES' : 'NO')
    
    if (user) {
      console.log('  - ID:', user.id)
      console.log('  - Email:', user.email)
      console.log('  - Role:', user.role)
      console.log('  - Has Password Hash:', !!user.passwordHash)
      
      // Test password comparison
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      console.log('  - Password valid:', isPasswordValid)
      
      if (isPasswordValid) {
        console.log('✅ Authentication should work!')
      } else {
        console.log('❌ Password comparison failed')
      }
    } else {
      console.log('❌ User not found with the query')
      
      // Let's check what users exist
      console.log('\n🔍 All users with role not STUDENT:')
      const nonStudents = await prisma.user.findMany({
        where: {
          role: { not: 'STUDENT' }
        }
      })
      
      nonStudents.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()
