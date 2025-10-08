import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Resetting student enrollments...')

  // Get the student user
  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' }
  })

  if (!student) {
    console.error('❌ Student not found.')
    return
  }

  // Remove all enrollments for the student
  const deletedEnrollments = await prisma.enrollment.deleteMany({
    where: { studentId: student.id }
  })

  // Remove all academic records for the student
  const deletedRecords = await prisma.academicRecord.deleteMany({
    where: { studentId: student.id }
  })

  // Remove all submissions for the student
  const deletedSubmissions = await prisma.submission.deleteMany({
    where: { studentId: student.id }
  })

  console.log(`✅ Reset completed!`)
  console.log(`   - Deleted ${deletedEnrollments.count} enrollments`)
  console.log(`   - Deleted ${deletedRecords.count} academic records`)
  console.log(`   - Deleted ${deletedSubmissions.count} submissions`)
  console.log('🎓 Student can now register for courses fresh!')
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
