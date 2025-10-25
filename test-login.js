#!/usr/bin/env node

/**
 * Login Test Script for SchoolPortal
 * Tests the login functionality to ensure it works properly
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

async function testLogin(email, password, expectedRole) {
  console.log(`\n🔐 Testing login for ${email} (expected role: ${expectedRole})`)
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    })

    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Login successful for ${email}`)
      console.log(`   Role: ${result.user.role}`)
      console.log(`   Name: ${result.user.name}`)
      console.log(`   Active: ${result.user.isActive}`)
      
      if (result.user.role === expectedRole) {
        console.log(`✅ Role matches expected: ${expectedRole}`)
        return true
      } else {
        console.log(`❌ Role mismatch. Expected: ${expectedRole}, Got: ${result.user.role}`)
        return false
      }
    } else {
      console.log(`❌ Login failed for ${email}: ${result.error}`)
      return false
    }
  } catch (error) {
    console.log(`💥 Network error for ${email}: ${error.message}`)
    return false
  }
}

async function testSessionCheck() {
  console.log(`\n🔍 Testing session check...`)
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'GET',
    })

    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Session check successful`)
      console.log(`   User: ${result.user.name} (${result.user.role})`)
      return true
    } else {
      console.log(`ℹ️ No active session (this is normal if not logged in)`)
      return true
    }
  } catch (error) {
    console.log(`💥 Session check error: ${error.message}`)
    return false
  }
}

async function runLoginTests() {
  console.log('🚀 Starting Login Tests...')
  console.log(`📍 Base URL: ${BASE_URL}`)
  
  const testCases = [
    // Add your test credentials here
    // { email: 'admin@university.edu', password: 'admin123', role: 'ADMIN' },
    // { email: 'lecturer@university.edu', password: 'lecturer123', role: 'LECTURER' },
    // { email: 'CS/ITC/21/0001', password: 'student123', role: 'STUDENT' },
  ]
  
  let passedTests = 0
  let totalTests = testCases.length + 1 // +1 for session check
  
  // Test session check
  if (await testSessionCheck()) {
    passedTests++
  }
  
  // Test login cases
  for (const testCase of testCases) {
    if (await testLogin(testCase.email, testCase.password, testCase.role)) {
      passedTests++
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All login tests passed!')
  } else {
    console.log('⚠️ Some tests failed. Check your credentials and user data.')
  }
  
  return passedTests === totalTests
}

// Run tests if this script is executed directly
if (require.main === module) {
  runLoginTests().catch(console.error)
}

module.exports = {
  runLoginTests,
  testLogin,
  testSessionCheck
}
