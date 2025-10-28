import { prisma } from './prisma'
import { NextRequest } from 'next/server'

export interface AuditLogData {
  userId?: string
  action: string
  entity: string
  entityId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an activity for audit purposes
 */
export async function logActivity(data: AuditLogData): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    })
  } catch (error) {
    // Don't throw errors in audit logging - just log them
    console.error('Failed to log activity:', error)
  }
}

/**
 * Get IP address and user agent from request
 */
export function getRequestInfo(request: NextRequest): {
  ipAddress: string | null
  userAgent: string | null
} {
  const ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    null
  
  const userAgent = request.headers.get('user-agent') || null

  return { ipAddress, userAgent }
}

/**
 * Helper to log user actions
 */
export async function logUserAction(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: any,
  request?: NextRequest
): Promise<void> {
  const requestInfo = request ? getRequestInfo(request) : { ipAddress: undefined, userAgent: undefined }

  await logActivity({
    userId,
    action,
    entity,
    entityId,
    details,
    ...requestInfo
  })
}

/**
 * Get activity logs for a user
 */
export async function getUserActivityLogs(
  userId: string,
  page: number = 1,
  limit: number = 50
): Promise<{
  logs: any[]
  total: number
  page: number
  totalPages: number
}> {
  const skip = (page - 1) * limit
  
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.activityLog.count({ where: { userId } })
  ])

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Get all activity logs (admin only)
 */
export async function getAllActivityLogs(
  page: number = 1,
  limit: number = 50,
  filters?: {
    userId?: string
    action?: string
    entity?: string
  }
): Promise<{
  logs: any[]
  total: number
  page: number
  totalPages: number
}> {
  const skip = (page - 1) * limit
  const where: any = {}
  
  if (filters?.userId) where.userId = filters.userId
  if (filters?.action) where.action = filters.action
  if (filters?.entity) where.entity = filters.entity

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.activityLog.count({ where })
  ])

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  }
}

