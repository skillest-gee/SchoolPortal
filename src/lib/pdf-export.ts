import jsPDF from 'jspdf'

/**
 * Generate PDF for transcript
 */
export function generateTranscriptPDF(transcriptData: any) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageWidth
  const pageHeight = doc.internal.pageHeight
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(20)
  doc.text('ACADEMIC TRANSCRIPT', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  doc.setFontSize(12)
  doc.text('UNIVERSITY SCHOOL PORTAL', pageWidth / 2, yPos, { align: 'center' })
  yPos += 20

  // Student Information
  doc.setFontSize(14)
  doc.text('Student Information', margin, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.text(`Name: ${transcriptData.studentName}`, margin, yPos)
  yPos += 7
  doc.text(`Student ID: ${transcriptData.studentId}`, margin, yPos)
  yPos += 7
  doc.text(`Programme: ${transcriptData.programme}`, margin, yPos)
  yPos += 7
  doc.text(`Level: ${transcriptData.level}`, margin, yPos)
  yPos += 10

  // GPA Information
  doc.setFontSize(12)
  doc.text(`Cumulative GPA: ${transcriptData.gpa.toFixed(2)}`, margin, yPos)
  yPos += 7
  doc.text(`Total Credits Earned: ${transcriptData.totalCredits}`, margin, yPos)
  yPos += 15

  // Academic Records Table
  doc.setFontSize(14)
  doc.text('Academic Records', margin, yPos)
  yPos += 10

  // Table Headers
  doc.setFontSize(9)
  const tableHeaders = ['Code', 'Course', 'Credits', 'Grade', 'Semester', 'Year']
  const colWidths = [25, 70, 20, 20, 25, 25]
  let xPos = margin

  doc.setFillColor(200, 200, 200)
  tableHeaders.forEach((header, i) => {
    doc.rect(xPos, yPos - 5, colWidths[i], 8, 'F')
    doc.text(header, xPos + 2, yPos, { maxWidth: colWidths[i] - 4 })
    xPos += colWidths[i]
  })
  yPos += 10

  // Table Data
  transcriptData.records.forEach((record: any) => {
    xPos = margin
    const row = [
      record.courseCode,
      record.courseTitle,
      record.credits.toString(),
      record.grade || 'N/A',
      record.semester,
      record.academicYear
    ]

    row.forEach((cell, i) => {
      doc.text(cell.substring(0, 15), xPos + 2, yPos, { maxWidth: colWidths[i] - 4 })
      xPos += colWidths[i]
    })

    yPos += 7

    // New page if needed
    if (yPos > pageHeight - 30) {
      doc.addPage()
      yPos = margin
    }
  })

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} of ${totalPages} - Generated on ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  return doc
}

/**
 * Generate PDF for receipt
 */
export function generateReceiptPDF(receiptData: any) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageWidth
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(18)
  doc.text('PAYMENT RECEIPT', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  doc.setFontSize(10)
  doc.text('UNIVERSITY SCHOOL PORTAL', pageWidth / 2, yPos, { align: 'center' })
  yPos += 20

  // Receipt Details
  doc.setFontSize(12)
  doc.text(`Receipt Number: ${receiptData.receiptNumber}`, margin, yPos)
  yPos += 10
  doc.text(`Date: ${new Date(receiptData.paymentDate).toLocaleDateString()}`, margin, yPos)
  yPos += 15

  // Student Information
  doc.setFontSize(11)
  doc.text('Student Information:', margin, yPos)
  yPos += 8
  doc.setFontSize(10)
  doc.text(`Name: ${receiptData.student.name}`, margin, yPos)
  yPos += 7
  doc.text(`Student ID: ${receiptData.student.studentId}`, margin, yPos)
  yPos += 7
  doc.text(`Email: ${receiptData.student.email}`, margin, yPos)
  yPos += 15

  // Payment Details
  doc.setFontSize(11)
  doc.text('Payment Details:', margin, yPos)
  yPos += 8
  doc.setFontSize(10)
  doc.text(`Amount: $${receiptData.paymentDetails.amount.toFixed(2)}`, margin, yPos)
  yPos += 7
  doc.text(`Method: ${receiptData.paymentDetails.method}`, margin, yPos)
  yPos += 7
  doc.text(`Reference: ${receiptData.paymentDetails.reference || 'N/A'}`, margin, yPos)
  yPos += 7
  doc.text(`Status: ${receiptData.paymentDetails.status}`, margin, yPos)
  yPos += 15

  // Fee Details
  doc.setFontSize(11)
  doc.text('Fee Details:', margin, yPos)
  yPos += 8
  doc.setFontSize(10)
  doc.text(`Type: ${receiptData.feeDetails.type}`, margin, yPos)
  yPos += 7
  doc.text(`Fee Amount: $${receiptData.feeDetails.amount.toFixed(2)}`, margin, yPos)
  yPos += 20

  // Footer
  doc.setFontSize(8)
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} - This is a computer-generated receipt`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )

  return doc
}

/**
 * Generate PDF for report
 */
export function generateReportPDF(reportData: any, title: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageWidth
  const pageHeight = doc.internal.pageHeight
  const margin = 20
  let yPos = margin

  // Header
  doc.setFontSize(18)
  doc.text(title.toUpperCase(), pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  doc.setFontSize(10)
  doc.text('UNIVERSITY SCHOOL PORTAL', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPos)
  yPos += 20

  // Report Content
  if (reportData.summary) {
    doc.setFontSize(12)
    doc.text('Summary', margin, yPos)
    yPos += 10

    doc.setFontSize(10)
    Object.entries(reportData.summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, margin, yPos)
      yPos += 7
      if (yPos > pageHeight - 30) {
        doc.addPage()
        yPos = margin
      }
    })
    yPos += 10
  }

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  return doc
}

