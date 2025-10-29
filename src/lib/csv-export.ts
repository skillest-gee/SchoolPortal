/**
 * Convert data array to CSV format
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  headers: string[] | ((item: T) => string[]),
  extractRow: (item: T) => (string | number)[]
): string {
  // Get header row
  let csv = ''
  if (typeof headers === 'function') {
    csv = headers(data[0] || ({} as T)).join(',') + '\n'
  } else {
    csv = headers.join(',') + '\n'
  }

  // Get data rows
  data.forEach((item) => {
    const row = extractRow(item)
    csv += row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n'
  })

  return csv
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export students to CSV
 */
export function exportStudentsToCSV(students: any[]) {
  const headers = ['Student ID', 'Name', 'Email', 'Programme', 'Level', 'Status', 'GPA']
  
  const csv = arrayToCSV(
    students,
    headers,
    (student) => [
      student.studentProfile?.studentId || 'N/A',
      student.name || 'N/A',
      student.email,
      student.studentProfile?.programme || 'N/A',
      student.studentProfile?.level || 'N/A',
      student.isActive ? 'Active' : 'Inactive',
      student.studentProfile?.gpa?.toFixed(2) || 'N/A'
    ]
  )

  downloadCSV(csv, `students_export_${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export applications to CSV
 */
export function exportApplicationsToCSV(applications: any[]) {
  const headers = [
    'Application Number',
    'First Name',
    'Last Name',
    'Email',
    'Programme',
    'Status',
    'Application Date'
  ]

  const csv = arrayToCSV(
    applications,
    headers,
    (app) => [
      app.applicationNumber,
      app.firstName || '',
      app.lastName || '',
      app.email,
      app.programme || 'N/A',
      app.status,
      new Date(app.createdAt).toLocaleDateString()
    ]
  )

  downloadCSV(csv, `applications_export_${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export courses to CSV
 */
export function exportCoursesToCSV(courses: any[]) {
  const headers = [
    'Course Code',
    'Title',
    'Department',
    'Level',
    'Credits',
    'Lecturer',
    'Status'
  ]

  const csv = arrayToCSV(
    courses,
    headers,
    (course) => [
      course.code,
      course.title,
      course.department,
      course.level,
      course.credits.toString(),
      course.lecturer?.name || 'N/A',
      course.isActive ? 'Active' : 'Inactive'
    ]
  )

  downloadCSV(csv, `courses_export_${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export fees to CSV
 */
export function exportFeesToCSV(fees: any[]) {
  const headers = [
    'Student ID',
    'Student Name',
    'Description',
    'Amount',
    'Due Date',
    'Status',
    'Payment Date'
  ]

  const csv = arrayToCSV(
    fees,
    headers,
    (fee) => [
      fee.student?.studentProfile?.studentId || 'N/A',
      fee.student?.name || 'N/A',
      fee.description,
      fee.amount.toFixed(2),
      new Date(fee.dueDate).toLocaleDateString(),
      fee.status,
      fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString() : 'N/A'
    ]
  )

  downloadCSV(csv, `fees_export_${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export attendance to CSV
 */
export function exportAttendanceToCSV(attendance: any[]) {
  const headers = [
    'Student ID',
    'Student Name',
    'Course Code',
    'Course Title',
    'Date',
    'Status',
    'Notes'
  ]

  const csv = arrayToCSV(
    attendance,
    headers,
    (record) => [
      record.student?.studentProfile?.studentId || 'N/A',
      record.student?.name || 'N/A',
      record.course?.code || 'N/A',
      record.course?.title || 'N/A',
      new Date(record.date).toLocaleDateString(),
      record.status,
      record.notes || ''
    ]
  )

  downloadCSV(csv, `attendance_export_${new Date().toISOString().split('T')[0]}.csv`)
}

