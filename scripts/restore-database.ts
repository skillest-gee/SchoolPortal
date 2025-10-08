#!/usr/bin/env tsx

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

async function restoreDatabase() {
  console.log('🔄 Starting database restore...')
  
  try {
    const backupFile = process.argv[2]
    
    if (!backupFile) {
      console.error('❌ Please provide a backup file path')
      console.log('Usage: npm run db:restore <backup-file-path>')
      process.exit(1)
    }
    
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Backup file not found: ${backupFile}`)
      process.exit(1)
    }
    
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    
    // Parse database URL
    const url = new URL(databaseUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1)
    const username = url.username
    const password = url.password
    
    console.log(`🔄 Restoring from: ${backupFile}`)
    
    // Restore database using psql
    const psqlCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${database} < "${backupFile}"`
    
    await execAsync(psqlCommand)
    
    console.log('✅ Database restore completed successfully!')
    
  } catch (error) {
    console.error('❌ Database restore failed:', error)
    process.exit(1)
  }
}

restoreDatabase()
