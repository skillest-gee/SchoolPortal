#!/usr/bin/env tsx

import { checkDatabaseConnection, getConnectionInfo } from '../src/lib/database'

async function checkDatabaseHealth() {
  console.log('🔍 Checking database health...')
  
  try {
    const isConnected = await checkDatabaseConnection()
    const connectionInfo = getConnectionInfo()
    
    console.log('\n📊 Database Connection Info:')
    console.log(`  Status: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`)
    console.log(`  Environment: ${connectionInfo.environment}`)
    console.log(`  Database URL: ${connectionInfo.databaseUrl}`)
    
    if (isConnected) {
      console.log('\n✅ Database health check passed!')
      process.exit(0)
    } else {
      console.log('\n❌ Database health check failed!')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Database health check error:', error)
    process.exit(1)
  }
}

checkDatabaseHealth()
