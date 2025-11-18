import { Injectable } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

export interface UserStatistics {
  totalReminders: number
  activeReminders: number
  totalMessages: number
  activeMessages: number
  completionRate: number
  mostActiveDay: string | null
  averageResponseTime: number | null
}

export interface ReminderStatistics {
  reminderId: string
  reminderText: string
  totalMessages: number
  completedMessages: number
  averageCompletionTime: number | null
  lastSent: Date | null
}

@Injectable()
export class StatisticsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get comprehensive statistics for a user
   */
  async getUserStatistics(userId: string): Promise<UserStatistics> {
    // Get all reminders for the user
    const reminders = await this.db.reminder.findMany({
      where: { userId },
      include: { message: true },
    })

    // Calculate statistics
    const totalReminders = reminders.length
    const activeReminders = reminders.filter((r) => r.message?.active).length

    // Get all messages
    const allMessages = await this.db.message.findMany({
      where: {
        reminder: {
          userId,
        },
      },
    })

    const totalMessages = allMessages.length
    const activeMessages = allMessages.filter((m) => m.active).length
    const completedMessages = allMessages.filter((m) => !m.active).length

    // Calculate completion rate
    const completionRate =
      totalMessages > 0 ? (completedMessages / totalMessages) * 100 : 0

    // Find most active day
    const dayCount: { [key: number]: number } = {}
    reminders.forEach((reminder) => {
      reminder.notificationDays.forEach((day) => {
        dayCount[day] = (dayCount[day] || 0) + 1
      })
    })

    const mostActiveDayIndex =
      Object.keys(dayCount).length > 0
        ? Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0][0]
        : null

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]
    const mostActiveDay = mostActiveDayIndex
      ? dayNames[parseInt(mostActiveDayIndex)]
      : null

    return {
      totalReminders,
      activeReminders,
      totalMessages,
      activeMessages,
      completionRate: Math.round(completionRate * 100) / 100,
      mostActiveDay,
      averageResponseTime: null, // Could be calculated if we track completion times
    }
  }

  /**
   * Get statistics for a specific reminder
   */
  async getReminderStatistics(
    reminderId: string,
    userId: string
  ): Promise<ReminderStatistics | null> {
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
      include: { message: true },
    })

    if (!reminder || reminder.userId !== userId) {
      return null
    }

    // Get all historical messages for this reminder
    // Note: Currently the schema only supports one message per reminder
    // In a real application, you'd want a message history table
    const messages = reminder.message ? [reminder.message] : []

    const totalMessages = messages.length
    const completedMessages = messages.filter((m) => !m.active).length

    return {
      reminderId: reminder.id,
      reminderText: reminder.text,
      totalMessages,
      completedMessages,
      averageCompletionTime: null,
      lastSent: reminder.message?.createdAt || null,
    }
  }

  /**
   * Get activity summary by day of week
   */
  async getActivityByDay(userId: string) {
    const reminders = await this.db.reminder.findMany({
      where: { userId },
    })

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]

    const activityByDay = dayNames.map((day, index) => ({
      day,
      count: 0,
    }))

    reminders.forEach((reminder) => {
      reminder.notificationDays.forEach((dayIndex) => {
        activityByDay[dayIndex].count += 1
      })
    })

    return activityByDay
  }
}
