// Email service for sending notifications using Resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || process.env.EMAIL_SERVER_PASSWORD)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text: string
}

export interface AdmissionEmailData {
  studentName: string
  email: string
  studentId: string
  programme: string
  fees: {
    admission: number
    tuition: number
    accommodation: number
    library: number
    laboratory?: number
    examination: number
    total: number
  }
  paymentInstructions: string
}

export interface LoginCredentialsEmailData {
  studentName: string
  email: string
  studentId: string
  password: string
  hallOfResidence: string
  loginUrl: string
  courseRegistrationInstructions: string
}

// Email templates
export function generateAdmissionEmail(data: AdmissionEmailData): EmailTemplate {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const subject = `🎉 CONGRATULATIONS! You've been admitted to ${data.programme}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admission Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #e8f4fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
        .fee-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .fee-table th, .fee-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .fee-table th { background-color: #f5f5f5; font-weight: bold; }
        .total-row { background-color: #e8f5e8; font-weight: bold; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎓 ADMISSION CONFIRMED!</h1>
        <h2>Welcome to Our Institution</h2>
      </div>
      
      <div class="content">
        <p>Dear <strong>${data.studentName}</strong>,</p>
        
        <div class="highlight">
          <h3>🎉 Congratulations!</h3>
          <p>We are delighted to inform you that you have been <strong>ADMITTED</strong> to our institution for the 2024/2025 academic year.</p>
        </div>

        <h3>📋 Your Admission Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.studentName}</li>
          <li><strong>Student ID:</strong> <span style="color: #2196F3; font-weight: bold;">${data.studentId}</span></li>
          <li><strong>Programme:</strong> ${data.programme}</li>
          <li><strong>Academic Year:</strong> 2024/2025</li>
          <li><strong>Admission Date:</strong> ${currentDate}</li>
        </ul>

        <h3>💰 Programme Fee Structure:</h3>
        <table class="fee-table">
          <thead>
            <tr>
              <th>Fee Type</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Admission Fee</td>
              <td>$${data.fees.admission.toLocaleString()}</td>
              <td style="color: #f44336; font-weight: bold;">REQUIRED NOW</td>
            </tr>
            <tr>
              <td>Tuition Fee</td>
              <td>$${data.fees.tuition.toLocaleString()}</td>
              <td style="color: #ff9800;">Due: Oct 1, 2024</td>
            </tr>
            <tr>
              <td>Accommodation Fee</td>
              <td>$${data.fees.accommodation.toLocaleString()}</td>
              <td style="color: #ff9800;">Due: Oct 15, 2024</td>
            </tr>
            <tr>
              <td>Library Fee</td>
              <td>$${data.fees.library.toLocaleString()}</td>
              <td style="color: #ff9800;">Due: Oct 20, 2024</td>
            </tr>
            ${data.fees.laboratory ? `
            <tr>
              <td>Laboratory Fee</td>
              <td>$${data.fees.laboratory.toLocaleString()}</td>
              <td style="color: #ff9800;">Due: Oct 25, 2024</td>
            </tr>
            ` : ''}
            <tr>
              <td>Examination Fee</td>
              <td>$${data.fees.examination.toLocaleString()}</td>
              <td style="color: #ff9800;">Due: Nov 1, 2024</td>
            </tr>
            <tr class="total-row">
              <td><strong>TOTAL PROGRAMME FEE</strong></td>
              <td><strong>$${data.fees.total.toLocaleString()}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div class="highlight">
          <h3>💳 PAYMENT REQUIRED FOR PORTAL ACCESS:</h3>
          <p><strong>ALL FEES MUST BE PAID BEFORE YOU CAN ACCESS THE STUDENT PORTAL</strong></p>
          <p><strong>Total Amount Due: $${data.fees.total.toLocaleString()}</strong></p>
          <p>${data.paymentInstructions}</p>
        </div>

        <h3>📝 Next Steps:</h3>
        <ol>
          <li><strong>Pay ALL fees</strong> totaling $${data.fees.total.toLocaleString()} immediately</li>
          <li><strong>Send payment confirmation</strong> to admissions@school.edu with all payment receipts</li>
          <li><strong>Wait for login credentials</strong> - You will receive another email with your portal login details ONLY after all fees are paid</li>
          <li><strong>Access the student portal</strong> to register for courses and access all features</li>
          <li><strong>Register for courses</strong> once you have portal access</li>
        </ol>

        <div class="highlight">
          <h3>⚠️ Important Notes:</h3>
          <ul>
            <li><strong>Your admission is conditional upon payment of ALL fees</strong></li>
            <li><strong>Login credentials will ONLY be provided after ALL fees are paid</strong></li>
            <li>Course registration will be available after login</li>
            <li>Keep this email and all payment receipts safe for your records</li>
            <li>Contact finance office if you need payment plan options</li>
          </ul>
        </div>

        <p>If you have any questions, please contact our admissions office at <strong>admissions@school.edu</strong> or call <strong>+1-234-567-8900</strong>.</p>
        
        <p>We look forward to welcoming you to our institution!</p>
        
        <p>Best regards,<br>
        <strong>Admissions Office</strong><br>
        School Portal - Tertiary Institution</p>
      </div>
      
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© 2024 School Portal - Tertiary Institution. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const text = `
CONGRATULATIONS! You've been admitted to ${data.programme}

Dear ${data.studentName},

We are delighted to inform you that you have been ADMITTED to our institution for the 2024/2025 academic year.

Your Admission Details:
- Name: ${data.studentName}
- Student ID: ${data.studentId}
- Programme: ${data.programme}
- Academic Year: 2024/2025
- Admission Date: ${currentDate}

Programme Fee Structure:
- Admission Fee: $${data.fees.admission.toLocaleString()} (REQUIRED NOW)
- Tuition Fee: $${data.fees.tuition.toLocaleString()} (Due: Oct 1, 2024)
- Accommodation Fee: $${data.fees.accommodation.toLocaleString()} (Due: Oct 15, 2024)
- Library Fee: $${data.fees.library.toLocaleString()} (Due: Oct 20, 2024)
${data.fees.laboratory ? `- Laboratory Fee: $${data.fees.laboratory.toLocaleString()} (Due: Oct 25, 2024)` : ''}
- Examination Fee: $${data.fees.examination.toLocaleString()} (Due: Nov 1, 2024)
- TOTAL: $${data.fees.total.toLocaleString()}

PAYMENT REQUIRED FOR PORTAL ACCESS:
ALL FEES MUST BE PAID BEFORE YOU CAN ACCESS THE STUDENT PORTAL
Total Amount Due: $${data.fees.total.toLocaleString()}

${data.paymentInstructions}

Next Steps:
1. Pay ALL fees totaling $${data.fees.total.toLocaleString()} immediately
2. Send payment confirmation to admissions@school.edu with all payment receipts
3. Wait for login credentials - You will receive another email with your portal login details ONLY after all fees are paid
4. Access the student portal to register for courses and access all features
5. Register for courses once you have portal access

Important Notes:
- Your admission is conditional upon payment of ALL fees
- Login credentials will ONLY be provided after ALL fees are paid
- Course registration will be available after login
- Keep this email and all payment receipts safe for your records
- Contact finance office if you need payment plan options

If you have any questions, please contact our admissions office at admissions@school.edu or call +1-234-567-8900.

We look forward to welcoming you to our institution!

Best regards,
Admissions Office
School Portal - Tertiary Institution

This is an automated message. Please do not reply to this email.
© 2024 School Portal - Tertiary Institution. All rights reserved.
  `

  return { to: data.email, subject, html, text }
}

export function generateLoginCredentialsEmail(data: LoginCredentialsEmailData): EmailTemplate {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const subject = `🔐 Your Student Portal Login Credentials - ${data.studentId}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login Credentials</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #4CAF50; }
        .credential-item { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
        .button { display: inline-block; background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Portal Access Granted!</h1>
        <h2>Your Login Credentials</h2>
      </div>
      
      <div class="content">
        <p>Dear <strong>${data.studentName}</strong>,</p>
        
        <p>Thank you for your payment confirmation. Your admission fee has been processed successfully, and we are pleased to provide you with access to the student portal.</p>

        <div class="credentials">
          <h3>🎓 Your Login Credentials:</h3>
          <div class="credential-item">
            <strong>Student ID:</strong> <span style="color: #2196F3; font-weight: bold; font-size: 18px;">${data.studentId}</span>
          </div>
          <div class="credential-item">
            <strong>Password:</strong> <span style="color: #f44336; font-weight: bold; font-size: 16px;">${data.password}</span>
          </div>
          <div class="credential-item">
            <strong>Login URL:</strong> <a href="${data.loginUrl}" class="button">Access Student Portal</a>
          </div>
        </div>

        <div class="warning">
          <h4>⚠️ Security Notice:</h4>
          <ul>
            <li>Please change your password immediately after first login</li>
            <li>Do not share your login credentials with anyone</li>
            <li>Log out after each session for security</li>
            <li>Contact IT support if you suspect unauthorized access</li>
          </ul>
        </div>

        <h3>🏠 Hall of Residence Assignment:</h3>
        <div class="credentials">
          <p><strong>Assigned Hall:</strong> <span style="color: #4CAF50; font-weight: bold; font-size: 18px;">${data.hallOfResidence}</span></p>
          <p>Your accommodation has been confirmed. Please report to the hall warden for room assignment and key collection.</p>
        </div>

        <h3>📚 Course Registration:</h3>
        <p>${data.courseRegistrationInstructions}</p>
        
        <h3>🎯 What You Can Do Now:</h3>
        <ol>
          <li><strong>Login to the portal</strong> using your credentials above</li>
          <li><strong>Change your password</strong> for security</li>
          <li><strong>Complete your profile</strong> with additional information</li>
          <li><strong>View your fees</strong> and payment status</li>
          <li><strong>Register for courses</strong> for the current semester</li>
          <li><strong>Check your timetable</strong> once courses are registered</li>
        </ol>

        <h3>📞 Support:</h3>
        <p>If you encounter any issues:</p>
        <ul>
          <li><strong>Technical Support:</strong> it-support@school.edu</li>
          <li><strong>Academic Support:</strong> academic@school.edu</li>
          <li><strong>General Inquiries:</strong> info@school.edu</li>
          <li><strong>Phone:</strong> +1-234-567-8900</li>
        </ul>

        <p>Welcome to our institution! We're excited to have you as part of our academic community.</p>
        
        <p>Best regards,<br>
        <strong>Student Services Office</strong><br>
        School Portal - Tertiary Institution</p>
      </div>
      
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© 2024 School Portal - Tertiary Institution. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const text = `
Your Student Portal Login Credentials - ${data.studentId}

Dear ${data.studentName},

Thank you for your payment confirmation. Your admission fee has been processed successfully, and we are pleased to provide you with access to the student portal.

Your Login Credentials:
- Student ID: ${data.studentId}
- Password: ${data.password}
- Login URL: ${data.loginUrl}

Security Notice:
- Please change your password immediately after first login
- Do not share your login credentials with anyone
- Log out after each session for security
- Contact IT support if you suspect unauthorized access

Hall of Residence Assignment:
- Assigned Hall: ${data.hallOfResidence}
- Your accommodation has been confirmed. Please report to the hall warden for room assignment and key collection.

Course Registration:
${data.courseRegistrationInstructions}

What You Can Do Now:
1. Login to the portal using your credentials above
2. Change your password for security
3. Complete your profile with additional information
4. View your fees and payment status
5. Register for courses for the current semester
6. Check your timetable once courses are registered

Support:
If you encounter any issues:
- Technical Support: it-support@school.edu
- Academic Support: academic@school.edu
- General Inquiries: info@school.edu
- Phone: +1-234-567-8900

Welcome to our institution! We're excited to have you as part of our academic community.

Best regards,
Student Services Office
School Portal - Tertiary Institution

This is an automated message. Please do not reply to this email.
© 2024 School Portal - Tertiary Institution. All rights reserved.
  `

  return { to: data.email, subject, html, text }
}

// Email sending function using Resend
export async function sendEmail(template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log('📧 SENDING EMAIL VIA RESEND:')
    console.log(`   To: ${template.to}`)
    console.log(`   Subject: ${template.subject}`)
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@schoolportal.com',
      to: [template.to],
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    if (error) {
      console.error('❌ Resend email error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email'
      }
    }

    console.log('✅ EMAIL SENT SUCCESSFULLY:', data?.id)
    
    return {
      success: true,
      messageId: data?.id
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
