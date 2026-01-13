import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { DatabaseService } from '../database/database.service'

/**
 * Analytics event types supported by the system
 */
export enum AnalyticsEventType {
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  REMINDER_CREATED = 'reminder_created',
  REMINDER_COMPLETED = 'reminder_completed',
  REMINDER_SNOOZED = 'reminder_snoozed',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_DELIVERED = 'message_delivered',
  MESSAGE_FAILED = 'message_failed',
  SUBSCRIPTION_STARTED = 'subscription_started',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
}

/**
 * Interface for analytics event data
 */
export interface AnalyticsEvent {
  id?: string
  type: AnalyticsEventType
  userId: string
  metadata?: Record<string, unknown>
  timestamp: Date
  sessionId?: string
  deviceInfo?: DeviceInfo
}

/**
 * Device information for analytics tracking
 */
export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web'
  version: string
  osVersion: string
  deviceModel?: string
}

/**
 * Aggregated metrics for dashboard display
 */
export interface AggregatedMetrics {
  totalUsers: number
  activeUsers: number
  totalReminders: number
  completedReminders: number
  messagesSent: number
  messagesDelivered: number
  deliveryRate: number
  avgRemindersPerUser: number
}

/**
 * Time range options for analytics queries
 */
export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'

/**
 * Configuration for analytics batching
 */
interface BatchConfig {
  maxSize: number
  flushIntervalMs: number
  retryAttempts: number
  retryDelayMs: number
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxSize: 100,
  flushIntervalMs: 5000,
  retryAttempts: 3,
  retryDelayMs: 1000,
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)
  private eventBuffer: AnalyticsEvent[] = []
  private readonly batchConfig: BatchConfig
  private isProcessing = false

  constructor(private readonly db: DatabaseService) {
    this.batchConfig = DEFAULT_BATCH_CONFIG
    this.logger.log('Analytics service initialized')
  }

  /**
   * Track a single analytics event
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<void> {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
    }

    this.eventBuffer.push(fullEvent)
    this.logger.debug(`Event buffered: ${event.type} for user ${event.userId}`)

    if (this.eventBuffer.length >= this.batchConfig.maxSize) {
      await this.flushEvents()
    }
  }

  /**
   * Track multiple events at once
   */
  async trackEvents(events: Omit<AnalyticsEvent, 'timestamp'>[]): Promise<void> {
    const timestamp = new Date()
    const fullEvents = events.map((event) => ({
      ...event,
      timestamp,
    }))

    this.eventBuffer.push(...fullEvents)
    this.logger.debug(`${events.length} events buffered`)

    if (this.eventBuffer.length >= this.batchConfig.maxSize) {
      await this.flushEvents()
    }
  }

  /**
   * Flush buffered events to the database
   */
  async flushEvents(): Promise<void> {
    if (this.isProcessing || this.eventBuffer.length === 0) {
      return
    }

    this.isProcessing = true
    const eventsToProcess = [...this.eventBuffer]
    this.eventBuffer = []

    try {
      await this.persistEvents(eventsToProcess)
      this.logger.log(`Successfully flushed ${eventsToProcess.length} events`)
    } catch (error) {
      this.logger.error(`Failed to flush events: ${error}`)
      // Put events back in buffer for retry
      this.eventBuffer.unshift(...eventsToProcess)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Persist events to the database with retry logic
   */
  private async persistEvents(events: AnalyticsEvent[]): Promise<void> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.batchConfig.retryAttempts; attempt++) {
      try {
        // In a real implementation, this would batch insert to the database
        this.logger.debug(`Persisting ${events.length} events (attempt ${attempt + 1})`)

        // Simulate database write
        await this.simulateDatabaseWrite(events)
        return
      } catch (error) {
        lastError = error as Error
        this.logger.warn(`Persist attempt ${attempt + 1} failed: ${error}`)

        if (attempt < this.batchConfig.retryAttempts - 1) {
          await this.delay(this.batchConfig.retryDelayMs * (attempt + 1))
        }
      }
    }

    throw lastError
  }

  /**
   * Simulate database write (placeholder for actual implementation)
   */
  private async simulateDatabaseWrite(events: AnalyticsEvent[]): Promise<void> {
    // This would be replaced with actual Prisma calls
    this.logger.debug(`Would write ${events.length} events to database`)
  }

  /**
   * Get aggregated metrics for a time range
   */
  async getMetrics(timeRange: TimeRange): Promise<AggregatedMetrics> {
    const startDate = this.getStartDate(timeRange)

    this.logger.log(`Fetching metrics for range: ${timeRange} (from ${startDate})`)

    // Fetch counts from database
    const [totalUsers, activeUsers, totalReminders, completedReminders] = await Promise.all([
      this.db.user.count(),
      this.getActiveUserCount(startDate),
      this.db.reminder.count(),
      this.getCompletedReminderCount(startDate),
    ])

    const messageStats = await this.getMessageStats(startDate)

    return {
      totalUsers,
      activeUsers,
      totalReminders,
      completedReminders,
      messagesSent: messageStats.sent,
      messagesDelivered: messageStats.delivered,
      deliveryRate: messageStats.sent > 0
        ? (messageStats.delivered / messageStats.sent) * 100
        : 0,
      avgRemindersPerUser: totalUsers > 0
        ? totalReminders / totalUsers
        : 0,
    }
  }

  /**
   * Get the start date for a given time range
   */
  private getStartDate(timeRange: TimeRange): Date {
    const now = new Date()

    switch (timeRange) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1))
      case 'week':
        return new Date(now.setDate(now.getDate() - 7))
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1))
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() - 3))
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1))
      case 'all':
        return new Date(0)
      default:
        return new Date(now.setDate(now.getDate() - 7))
    }
  }

  /**
   * Get count of active users since a start date
   */
  private async getActiveUserCount(since: Date): Promise<number> {
    // In real implementation, this would query users with activity since the date
    const users = await this.db.user.findMany({
      where: {
        createdAt: {
          gte: since,
        },
      },
    })
    return users.length
  }

  /**
   * Get count of completed reminders since a start date
   */
  private async getCompletedReminderCount(since: Date): Promise<number> {
    // Placeholder - would need a completedAt field on reminders
    return 0
  }

  /**
   * Get message statistics since a start date
   */
  private async getMessageStats(since: Date): Promise<{ sent: number; delivered: number }> {
    const messages = await this.db.message.findMany({
      where: {
        createdAt: {
          gte: since,
        },
      },
    })

    return {
      sent: messages.length,
      delivered: messages.filter((m) => !m.active).length,
    }
  }

  /**
   * Get user activity timeline
   */
  async getUserTimeline(userId: string, limit = 50): Promise<AnalyticsEvent[]> {
    this.logger.debug(`Fetching timeline for user ${userId}`)

    // This would query the analytics events table
    return []
  }

  /**
   * Get most active users
   */
  async getMostActiveUsers(limit = 10): Promise<Array<{ userId: string; eventCount: number }>> {
    this.logger.debug(`Fetching top ${limit} most active users`)

    // This would aggregate events by user
    return []
  }

  /**
   * Get event counts by type
   */
  async getEventCountsByType(
    timeRange: TimeRange
  ): Promise<Record<AnalyticsEventType, number>> {
    const startDate = this.getStartDate(timeRange)
    this.logger.debug(`Fetching event counts since ${startDate}`)

    // Initialize counts for all event types
    const counts: Record<AnalyticsEventType, number> = {
      [AnalyticsEventType.USER_SIGNUP]: 0,
      [AnalyticsEventType.USER_LOGIN]: 0,
      [AnalyticsEventType.REMINDER_CREATED]: 0,
      [AnalyticsEventType.REMINDER_COMPLETED]: 0,
      [AnalyticsEventType.REMINDER_SNOOZED]: 0,
      [AnalyticsEventType.MESSAGE_SENT]: 0,
      [AnalyticsEventType.MESSAGE_DELIVERED]: 0,
      [AnalyticsEventType.MESSAGE_FAILED]: 0,
      [AnalyticsEventType.SUBSCRIPTION_STARTED]: 0,
      [AnalyticsEventType.SUBSCRIPTION_CANCELLED]: 0,
      [AnalyticsEventType.SUBSCRIPTION_RENEWED]: 0,
    }

    return counts
  }

  /**
   * Export analytics data to CSV format
   */
  async exportToCsv(timeRange: TimeRange): Promise<string> {
    const startDate = this.getStartDate(timeRange)
    this.logger.log(`Exporting analytics data since ${startDate}`)

    const headers = ['timestamp', 'event_type', 'user_id', 'metadata']
    const rows: string[] = [headers.join(',')]

    // In real implementation, would fetch and format events
    return rows.join('\n')
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldData(retentionDays: number): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    this.logger.log(`Cleaning up analytics data older than ${cutoffDate}`)

    // In real implementation, would delete old records
    return 0
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Scheduled job to flush events periodically
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async scheduledFlush(): Promise<void> {
    if (this.eventBuffer.length > 0) {
      this.logger.debug(`Scheduled flush: ${this.eventBuffer.length} events in buffer`)
      await this.flushEvents()
    }
  }

  /**
   * Scheduled job to clean up old data weekly
   */
  @Cron(CronExpression.EVERY_WEEK)
  async scheduledCleanup(): Promise<void> {
    this.logger.log('Running scheduled analytics cleanup')
    const deletedCount = await this.cleanupOldData(90) // 90 day retention
    this.logger.log(`Cleanup complete: ${deletedCount} records removed`)
  }
}
