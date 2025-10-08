import { PrismaClient } from '@prisma/client'

// Database connection pool configuration
const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })
}

// Singleton pattern for database connection
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

// Database transaction helper
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback)
}

// Connection pool monitoring
export function getConnectionInfo() {
  return {
    isConnected: prisma.$connect ? true : false,
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured'
  }
}
