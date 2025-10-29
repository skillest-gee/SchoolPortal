// Shared utility functions for fee management
import { prisma } from '@/lib/prisma'

// Programme-specific fee structures
export const programmeFees = {
  'BACHELOR OF SCIENCE (INFORMATION TECHNOLOGY)': {
    admission: 5000,
    tuition: 18000,
    accommodation: 3500,
    library: 600,
    laboratory: 1200,
    examination: 800,
    total: 26100
  },
  'BACHELOR OF SCIENCE (COMPUTER SCIENCE)': {
    admission: 5000,
    tuition: 18000,
    accommodation: 3500,
    library: 600,
    laboratory: 1200,
    examination: 800,
    total: 26100
  },
  'BACHELOR OF SCIENCE (SOFTWARE ENGINEERING)': {
    admission: 5000,
    tuition: 20000,
    accommodation: 3500,
    library: 600,
    laboratory: 1500,
    examination: 800,
    total: 27400
  },
  'BACHELOR OF ARTS (BUSINESS ADMINISTRATION)': {
    admission: 5000,
    tuition: 15000,
    accommodation: 3500,
    library: 500,
    examination: 600,
    total: 21600
  },
  'BACHELOR OF SCIENCE (ACCOUNTING)': {
    admission: 5000,
    tuition: 16000,
    accommodation: 3500,
    library: 500,
    examination: 700,
    total: 21700
  }
}

/**
 * Find fee structure for a programme by matching programme name
 */
export function findFeeStructure(programme: string) {
  // Try exact match first
  let fees = programmeFees[programme as keyof typeof programmeFees]
  
  // If no exact match, try partial matching for common programme names
  if (!fees) {
    const programmeUpper = programme.toUpperCase()
    
    if (programmeUpper.includes('COMPUTER SCIENCE') || programmeUpper.includes('CS')) {
      fees = programmeFees['BACHELOR OF SCIENCE (COMPUTER SCIENCE)']
    } else if (programmeUpper.includes('INFORMATION TECHNOLOGY') || programmeUpper.includes('IT')) {
      fees = programmeFees['BACHELOR OF SCIENCE (INFORMATION TECHNOLOGY)']
    } else if (programmeUpper.includes('SOFTWARE ENGINEERING') || programmeUpper.includes('SE')) {
      fees = programmeFees['BACHELOR OF SCIENCE (SOFTWARE ENGINEERING)']
    } else if (programmeUpper.includes('BUSINESS ADMINISTRATION') || programmeUpper.includes('BA')) {
      fees = programmeFees['BACHELOR OF ARTS (BUSINESS ADMINISTRATION)']
    } else if (programmeUpper.includes('ACCOUNTING')) {
      fees = programmeFees['BACHELOR OF SCIENCE (ACCOUNTING)']
    }
  }
  
  return fees
}

/**
 * Create programme-specific fees for a student
 */
export async function createProgrammeFees(studentId: string, programme: string) {
  const fees = findFeeStructure(programme)
  
  if (!fees) {
    console.log(`⚠️ No fee structure defined for programme: ${programme}`)
    console.log(`Available programmes: ${Object.keys(programmeFees).join(', ')}`)
    return { success: false, error: `No fee structure found for programme: ${programme}` }
  }

  console.log(`💰 Creating fees for programme: ${programme}`)

  try {
    // 1. ADMISSION FEE (Must be paid before getting login credentials)
    await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.admission,
        description: `Admission Fee - ${programme}`,
        dueDate: new Date('2024-09-01'),
        isPaid: false
      }
    })

    // 2. TUITION FEE (Main academic fee)
    await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.tuition,
        description: `Tuition Fee - ${programme} - First Semester 2024/2025`,
        dueDate: new Date('2024-10-01'),
        isPaid: false
      }
    })

    // 3. ACCOMMODATION FEE
    await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.accommodation,
        description: `Accommodation Fee - ${programme} - First Semester 2024/2025`,
        dueDate: new Date('2024-10-15'),
        isPaid: false
      }
    })

    // 4. LIBRARY FEE
    await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.library,
        description: `Library Fee - ${programme} - First Semester 2024/2025`,
        dueDate: new Date('2024-10-20'),
        isPaid: false
      }
    })

    // 5. LABORATORY FEE (For IT/CS/SE programmes)
    if ('laboratory' in fees && fees.laboratory) {
      await prisma.fee.create({
        data: {
          studentId: studentId,
          amount: fees.laboratory,
          description: `Laboratory Fee - ${programme} - First Semester 2024/2025`,
          dueDate: new Date('2024-10-25'),
          isPaid: false
        }
      })
    }

    // 6. EXAMINATION FEE
    await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.examination,
        description: `Examination Fee - ${programme} - First Semester 2024/2025`,
        dueDate: new Date('2024-11-01'),
        isPaid: false
      }
    })

    console.log(`✅ Created fees for programme: ${programme}`)
    return { success: true }
  } catch (error) {
    console.error('Error creating fees:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create fees' 
    }
  }
}

