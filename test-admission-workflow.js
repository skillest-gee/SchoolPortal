// Test script to verify the complete admission workflow
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

async function testAdmissionWorkflow() {
  console.log('🧪 Testing Complete Admission Workflow...\n')
  
  try {
    // Step 1: Create a test application
    console.log('1️⃣ Creating test application...')
    const applicationData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe.test@example.com',
      phoneNumber: '+1234567890',
      dateOfBirth: '2000-01-01',
      gender: 'M',
      nationality: 'American',
      address: '123 Test Street, Test City',
      city: 'Test City',
      state: 'Test State',
      programmeId: '1', // Assuming we have a programme with ID 1
      previousSchool: 'Test High School',
      graduationYear: 2023,
      previousGrade: 3.5,
      qualificationType: 'High School Diploma',
      entryLevel: '100',
      studyMode: 'Full Time',
      academicYear: '2024/2025',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+1234567891',
      emergencyContactRelationship: 'Mother',
      emergencyContactAddress: '123 Test Street, Test City',
      motivationStatement: 'I am passionate about computer science and want to pursue a career in software development. This programme will provide me with the necessary skills and knowledge to achieve my goals.'
    }

    const applicationResponse = await fetch('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(applicationData)
    })

    if (!applicationResponse.ok) {
      const error = await applicationResponse.text()
      console.log('❌ Failed to create application:', error)
      return
    }

    const application = await applicationResponse.json()
    console.log('✅ Application created:', application.data.applicationNumber)

    // Step 2: Admin approves the application
    console.log('\n2️⃣ Admin approving application...')
    const approvalResponse = await fetch(`http://localhost:3000/api/applications/${application.data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=admin-session-token' // This would need to be a real admin session
      },
      body: JSON.stringify({
        status: 'APPROVED',
        adminNotes: 'Application approved for testing'
      })
    })

    if (!approvalResponse.ok) {
      const error = await approvalResponse.text()
      console.log('❌ Failed to approve application:', error)
      return
    }

    const approvedApp = await approvalResponse.json()
    console.log('✅ Application approved, Student ID:', approvedApp.data.generatedStudentId)

    // Step 3: Check if fees were created
    console.log('\n3️⃣ Checking created fees...')
    const feesResponse = await fetch(`http://localhost:3000/api/finance/fees?studentId=${approvedApp.data.generatedStudentId}`)
    
    if (feesResponse.ok) {
      const fees = await feesResponse.json()
      console.log('✅ Fees created:', fees.data.length, 'fees')
      fees.data.forEach(fee => {
        console.log(`   - ${fee.description}: $${fee.amount} (${fee.isPaid ? 'PAID' : 'UNPAID'})`)
      })
    }

    // Step 4: Simulate fee payment
    console.log('\n4️⃣ Simulating fee payment...')
    const fees = await feesResponse.json()
    if (fees.data.length > 0) {
      const firstFee = fees.data[0]
      const paymentResponse = await fetch('http://localhost:3000/api/finance/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=student-session-token' // This would need to be a real student session
        },
        body: JSON.stringify({
          feeId: firstFee.id,
          amount: firstFee.amount,
          paymentMethod: 'BANK_TRANSFER',
          reference: `PAY-${Date.now()}`,
          notes: 'Test payment'
        })
      })

      if (paymentResponse.ok) {
        console.log('✅ Payment processed successfully')
      } else {
        console.log('❌ Payment failed:', await paymentResponse.text())
      }
    }

    // Step 5: Test login credentials sending
    console.log('\n5️⃣ Testing login credentials sending...')
    const credentialsResponse = await fetch('http://localhost:3000/api/admin/send-login-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=admin-session-token' // This would need to be a real admin session
      },
      body: JSON.stringify({
        studentId: approvedApp.data.generatedStudentId,
        hallOfResidence: 'Test Hall A',
        courseRegistrationInstructions: 'Test instructions for course registration'
      })
    })

    if (credentialsResponse.ok) {
      console.log('✅ Login credentials sent successfully')
    } else {
      const error = await credentialsResponse.json()
      console.log('❌ Failed to send credentials:', error.error)
      if (error.details) {
        console.log('   Details:', error.details)
      }
    }

    console.log('\n🎉 Admission workflow test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testAdmissionWorkflow()

