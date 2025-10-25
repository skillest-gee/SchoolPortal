import { prisma } from './prisma'

// Get student ID from user ID
export async function getStudentIdFromUserId(userId: string): Promise<string | null> {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { studentId: true }
    })
    
    return studentProfile?.studentId || null
  } catch (error) {
    console.error('Error getting student ID from user ID:', error)
    return null
  }
}

// Get user ID from student ID
export async function getUserIdFromStudentId(studentId: string): Promise<string | null> {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId },
      select: { userId: true }
    })
    
    return studentProfile?.userId || null
  } catch (error) {
    console.error('Error getting user ID from student ID:', error)
    return null
  }
}

// Get student profile by user ID
export async function getStudentProfileByUserId(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true
      }
    })
    
    return user?.studentProfile || null
  } catch (error) {
    console.error('Error getting student profile by user ID:', error)
    return null
  }
}

// Get user by student ID
export async function getUserByStudentId(studentId: string) {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { studentId },
      include: {
        user: true
      }
    })
    
    return studentProfile?.user || null
  } catch (error) {
    console.error('Error getting user by student ID:', error)
    return null
  }
}

// Generate student ID based on year and sequence
export function generateStudentId(year: string = '2024'): string {
  // Generate random 3-digit number (001-999)
  const randomNum = Math.floor(1 + Math.random() * 999)
  
  // Format: STU2024004 (STU + year + 3-digit number)
  return `STU${year}${randomNum.toString().padStart(3, '0')}`
}

// Generate sequential student ID (for admin use)
export async function generateSequentialStudentId(year: string = '2024'): Promise<string> {
  try {
    // Find the highest existing student ID for the year
    const existingIds = await prisma.studentProfile.findMany({
      where: {
        studentId: {
          startsWith: `STU${year}`
        }
      },
      select: { studentId: true },
      orderBy: { studentId: 'desc' }
    })
    
    let nextNumber = 1
    if (existingIds.length > 0) {
      // Extract the number from the last ID and increment
      const lastId = existingIds[0].studentId
      const lastNumber = parseInt(lastId.substring(7)) // STU2024XXX -> XXX
      nextNumber = lastNumber + 1
    }
    
    return `STU${year}${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating sequential student ID:', error)
    // Fallback to random generation
    return generateStudentId(year)
  }
}

// Validate student ID format
export function isValidStudentId(studentId: string): boolean {
  // Format: STU2024004 (STU + 4-digit year + 3-digit number)
  const pattern = /^STU\d{4}\d{3}$/
  return pattern.test(studentId)
}

// Extract year from student ID
export function extractYearFromStudentId(studentId: string): string | null {
  if (!isValidStudentId(studentId)) return null
  return studentId.substring(3, 7) // STU2024004 -> 2024
}
