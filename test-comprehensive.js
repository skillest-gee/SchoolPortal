#!/usr/bin/env node

/**
 * Comprehensive Test Script for SchoolPortal
 * Tests all major functionality including lecturer, admin, file upload, email, and admission
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// Test data
const testData = {
  admin: {
    email: 'admin@university.edu',
    password: 'admin123'
  },
  lecturer: {
    email: 'lecturer@university.edu', 
    password: 'lecturer123'
  },
  student: {
    email: 'student@university.edu',
    password: 'student123'
  }
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  console.log(`🔍 Testing: ${options.method || 'GET'} ${endpoint}`)
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ Success: ${response.status}`)
      return { success: true, data, status: response.status }
    } else {
      console.log(`❌ Error: ${response.status} - ${data.error || 'Unknown error'}`)
      return { success: false, error: data.error, status: response.status }
    }
  } catch (error) {
    console.log(`💥 Network Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testFileUpload() {
  console.log('\n📁 Testing File Upload...')
  
  // Create a test file
  const testFile = new File(['Test file content'], 'test.txt', { type: 'text/plain' })
  const formData = new FormData()
  formData.append('file', testFile)
  formData.append('type', 'document')
  
  try {
    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      console.log(`✅ File upload successful: ${data.filePath}`)
      return { success: true, filePath: data.filePath }
    } else {
      console.log(`❌ File upload failed: ${data.error}`)
      return { success: false, error: data.error }
    }
  } catch (error) {
    console.log(`💥 File upload error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testEmailService() {
  console.log('\n📧 Testing Email Service...')
  
  // Test email sending (this would normally require authentication)
  const emailTest = await makeRequest('/api/test-email', {
    method: 'POST',
    body: JSON.stringify({
      to: 'test@example.com',
      subject: 'Test Email',
      message: 'This is a test email from SchoolPortal'
    })
  })
  
  if (emailTest.success) {
    console.log('✅ Email service is working')
  } else {
    console.log('⚠️ Email service test endpoint not available (this is normal)')
  }
}

async function testLecturerAPIs() {
  console.log('\n👨‍🏫 Testing Lecturer APIs...')
  
  const tests = [
    '/api/lecturer/dashboard',
    '/api/lecturer/courses', 
    '/api/lecturer/students',
    '/api/lecturer/grades',
    '/api/lecturer/assignments'
  ]
  
  const results = []
  for (const endpoint of tests) {
    const result = await makeRequest(endpoint)
    results.push({ endpoint, ...result })
  }
  
  return results
}

async function testAdminAPIs() {
  console.log('\n👨‍💼 Testing Admin APIs...')
  
  const tests = [
    '/api/admin/dashboard',
    '/api/admin/users',
    '/api/admin/settings',
    '/api/admin/applications',
    '/api/admin/courses',
    '/api/admin/announcements'
  ]
  
  const results = []
  for (const endpoint of tests) {
    const result = await makeRequest(endpoint)
    results.push({ endpoint, ...result })
  }
  
  return results
}

async function testAdmissionProcess() {
  console.log('\n🎓 Testing Admission Process...')
  
  // Test application submission
  const applicationData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    programmeId: 'test-programme-id',
    // ... other required fields
  }
  
  const applicationResult = await makeRequest('/api/applications', {
    method: 'POST',
    body: JSON.stringify(applicationData)
  })
  
  return applicationResult
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...')
  
  const dbTest = await makeRequest('/api/health/database')
  
  if (dbTest.success) {
    console.log('✅ Database connection is healthy')
  } else {
    console.log('❌ Database connection failed')
  }
  
  return dbTest
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive SchoolPortal Tests...')
  console.log(`📍 Base URL: ${BASE_URL}`)
  
  const results = {
    database: await testDatabaseConnection(),
    fileUpload: await testFileUpload(),
    emailService: await testEmailService(),
    lecturerAPIs: await testLecturerAPIs(),
    adminAPIs: await testAdminAPIs(),
    admissionProcess: await testAdmissionProcess()
  }
  
  // Summary
  console.log('\n📊 Test Summary:')
  console.log('================')
  
  Object.entries(results).forEach(([category, result]) => {
    if (Array.isArray(result)) {
      const successCount = result.filter(r => r.success).length
      const totalCount = result.length
      console.log(`${category}: ${successCount}/${totalCount} tests passed`)
    } else {
      console.log(`${category}: ${result.success ? '✅ PASS' : '❌ FAIL'}`)
    }
  })
  
  console.log('\n🎉 Test completed!')
  
  return results
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = {
  runAllTests,
  testFileUpload,
  testEmailService,
  testLecturerAPIs,
  testAdminAPIs,
  testAdmissionProcess,
  testDatabaseConnection
}
