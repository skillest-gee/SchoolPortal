// Re-export from database.ts for backward compatibility
export { prisma, checkDatabaseConnection, disconnectDatabase, withTransaction, getConnectionInfo } from './database'
