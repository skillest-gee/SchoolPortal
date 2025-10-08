const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin user...')
    
    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@school.edu'
      }
    })
    
    if (admin) {
      console.log('✅ Admin user found:')
      console.log('  - ID:', admin.id)
      console.log('  - Email:', admin.email)
      console.log('  - Name:', admin.name)
      console.log('  - Role:', admin.role)
      console.log('  - Is Active:', admin.isActive)
      console.log('  - Has Password Hash:', !!admin.passwordHash)
      
      // Test password
      const testPassword = 'admin123'
      const isPasswordValid = await bcrypt.compare(testPassword, admin.passwordHash)
      console.log('  - Password "admin123" is valid:', isPasswordValid)
      
    } else {
      console.log('❌ Admin user not found!')
    }
    
    // Check all users
    console.log('\n📋 All users in database:')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        indexNumber: true
      }
    })
    
    allUsers.forEach(user => {
      console.log(`  - ${user.email || user.indexNumber} (${user.role}) - Active: ${user.isActive}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
