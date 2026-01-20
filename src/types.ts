import { Reminder, User, Message } from '@prisma/client'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UserWithReminders extends User {
  reminders: Reminder[]
}

export interface ReminderWithMessages extends Reminder {
  messages: Message[]
}

export interface ReminderWithUser extends Reminder {
  user: User
}

export interface MessageWithReminder extends Message {
  reminder: Reminder
}

export interface FullReminder extends Reminder {
  user: User
  messages: Message[]
}

export interface NotificationPayload {
  userId: string
  reminderId: string
  text: string
  emoji: string
  phone: string
}

export interface SmsWebhookPayload {
  From: string
  To: string
  Body: string
  MessageSid: string
  AccountSid: string
  NumMedia: string
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  version: string
  uptime: number
  services: {
    database: boolean
    twilio: boolean
  }
}

export interface SystemMetrics {
  nodeVersion: string
  platform: string
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }
  cpuUsage: {
    user: number
    system: number
  }
  uptime: number
}

export interface DateRange {
  start: Date
  end: Date
}

export interface TimeSlot {
  hour: number
  minute: number
}

export interface DayOfWeek {
  index: number
  name: string
  shortName: string
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  { index: 0, name: 'Sunday', shortName: 'Sun' },
  { index: 1, name: 'Monday', shortName: 'Mon' },
  { index: 2, name: 'Tuesday', shortName: 'Tue' },
  { index: 3, name: 'Wednesday', shortName: 'Wed' },
  { index: 4, name: 'Thursday', shortName: 'Thu' },
  { index: 5, name: 'Friday', shortName: 'Fri' },
  { index: 6, name: 'Saturday', shortName: 'Sat' },
]

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'

export interface RequestContext {
  userId: string
  requestId: string
  timestamp: Date
  method: HttpMethod
  path: string
}

export interface AuditLogEntry {
  id: string
  userId: string
  action: string
  resourceType: string
  resourceId: string
  metadata?: Record<string, unknown>
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipFailedRequests?: boolean
  keyGenerator?: (req: unknown) => string
}

export interface CacheConfig {
  ttl: number
  maxItems: number
  strategy: 'lru' | 'lfu' | 'fifo'
}

export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  exponentialBase: number
}
