#!/usr/bin/env tsx

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

async function backupDatabase() {
  console.log('💾 Starting database backup...')
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(process.cwd(), 'backups')
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`)
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
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
    
    // Create backup using pg_dump
    const pgDumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-owner --no-privileges --clean --if-exists > "${backupFile}"`
    
    console.log('🔄 Creating backup...')
    await execAsync(pgDumpCommand)
    
    // Get file size
    const stats = fs.statSync(backupFile)
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
    
    console.log(`✅ Database backup completed successfully!`)
    console.log(`📁 Backup file: ${backupFile}`)
    console.log(`📊 File size: ${fileSizeInMB} MB`)
    
  } catch (error) {
    console.error('❌ Database backup failed:', error)
    process.exit(1)
  }
}

backupDatabase()
