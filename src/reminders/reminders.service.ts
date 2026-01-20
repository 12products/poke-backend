import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { utcToZonedTime } from 'date-fns-tz'

import { Reminder, Prisma, User } from '@prisma/client'
import { MessageService } from '../message/message.service'
import { DatabaseService } from '../database/database.service'
import {
  emojis,
  MAX_REMINDERS_FREE,
  MAX_REMINDERS_PREMIUM,
  SUBSCRIPTION_TIERS,
} from '../constants'
import { getNotificationTime, formatDateForLog, generateTrackingId } from '../utils'

export interface ReminderStats {
  totalReminders: number
  activeToday: number
  completedToday: number
  upcomingCount: number
}

export interface ReminderWithStatus extends Reminder {
  isActiveToday: boolean
  nextNotificationTime: Date | null
}

const getNextEmojiIndex = (reminders: Reminder[]): number => {
  if (!reminders.length) {
    return Math.floor(Math.random() * emojis.length)
  }
  const lastEmoji = reminders[reminders.length - 1].emoji
  const lastEmojiIndex = emojis.indexOf(lastEmoji)
  return lastEmojiIndex < 0 ? 0 : (lastEmojiIndex + 1) % emojis.length
}

const getMaxReminders = (subscriptionTier: string | null): number => {
  if (!subscriptionTier) return MAX_REMINDERS_FREE
  if (subscriptionTier === SUBSCRIPTION_TIERS.ENTERPRISE) return Infinity
  if (subscriptionTier === SUBSCRIPTION_TIERS.PREMIUM) return MAX_REMINDERS_PREMIUM
  return MAX_REMINDERS_FREE
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly messageService: MessageService
  ) {}

  async create(user: { id: string }, data: Prisma.ReminderCreateInput): Promise<Reminder> {
    const trackingId = generateTrackingId()
    this.logger.log(`[${trackingId}] Creating reminder for user: ${user.id}`)

    const currentReminders = await this.findAll(user.id)
    const currentUser: User = await this.db.user.findUnique({
      where: { id: user.id },
    })

    if (!currentUser) {
      throw new NotFoundException('User not found')
    }

    const maxReminders = getMaxReminders(currentUser.activeSubscription)
    if (currentReminders.length >= maxReminders) {
      this.logger.warn(
        `[${trackingId}] User ${user.id} reached reminder limit: ${currentReminders.length}/${maxReminders}`
      )
      throw new ForbiddenException(
        `You have reached the maximum number of reminders (${maxReminders}). ` +
          'Please upgrade your subscription or delete an existing reminder.'
      )
    }

    const emojiIndex = getNextEmojiIndex(currentReminders)
    const notificationTime = getNotificationTime(new Date(data.notificationTime))

    this.logger.log(
      `[${trackingId}] Creating reminder with notification time: ${formatDateForLog(notificationTime)}, ` +
        `days: ${data.notificationDays}, emoji: ${emojis[emojiIndex]}`
    )

    const reminder = await this.db.reminder.create({
      data: {
        ...data,
        emoji: emojis[emojiIndex],
        notificationTime,
        user: {
          connect: { id: user.id },
        },
      },
    })

    this.logger.log(`[${trackingId}] Successfully created reminder: ${reminder.id}`)
    return reminder
  }

  async findAll(userId: string): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findAllWithStatus(userId: string): Promise<ReminderWithStatus[]> {
    const reminders = await this.findAll(userId)
    const now = new Date()

    return reminders.map((reminder) => {
      const userLocalNow = utcToZonedTime(now, reminder.timeZone)
      const isActiveToday = reminder.notificationDays.includes(userLocalNow.getDay())

      return {
        ...reminder,
        isActiveToday,
        nextNotificationTime: isActiveToday ? reminder.notificationTime : null,
      }
    })
  }

  async findOne(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder | null> {
    const reminder = await this.db.reminder.findUnique({ where })
    if (!reminder) {
      return null
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenException('You do not have access to this reminder')
    }
    return reminder
  }

  async findOneOrFail(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder> {
    const reminder = await this.findOne(where, userId)
    if (!reminder) {
      throw new NotFoundException('Reminder not found')
    }
    return reminder
  }

  async update({
    where,
    data,
    userId,
  }: {
    where: Prisma.ReminderWhereUniqueInput
    data: Prisma.ReminderUpdateInput
    userId: string
  }): Promise<Reminder> {
    const trackingId = generateTrackingId()
    const reminder = await this.findOneOrFail(where, userId)

    this.logger.log(
      `[${trackingId}] Updating reminder ${reminder.id} with: ${JSON.stringify(data)}`
    )

    if (data.notificationTime) {
      data.notificationTime = getNotificationTime(new Date(data.notificationTime as string))
    }

    const updated = await this.db.reminder.update({ where, data })
    this.logger.log(`[${trackingId}] Successfully updated reminder: ${reminder.id}`)
    return updated
  }

  async remove(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder> {
    const trackingId = generateTrackingId()
    const reminder = await this.findOneOrFail(where, userId)

    this.logger.log(`[${trackingId}] Removing reminder: ${reminder.id}`)

    try {
      await this.db.message.deleteMany({
        where: { reminderId: reminder.id },
      })
      this.logger.debug(`[${trackingId}] Deleted associated messages for reminder: ${reminder.id}`)
    } catch (e) {
      this.logger.error(
        `[${trackingId}] Failed to delete messages for reminder ${reminder.id}: ${e.message}`
      )
    }

    const deleted = await this.db.reminder.delete({ where: { id: where.id } })
    this.logger.log(`[${trackingId}] Successfully removed reminder: ${reminder.id}`)
    return deleted
  }

  async getStats(userId: string): Promise<ReminderStats> {
    const reminders = await this.findAll(userId)
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    let activeToday = 0

    for (const reminder of reminders) {
      const userLocalNow = utcToZonedTime(now, reminder.timeZone)
      if (reminder.notificationDays.includes(userLocalNow.getDay())) {
        activeToday++
      }
    }

    const completedMessages = await this.db.message.count({
      where: {
        reminder: { userId },
        active: false,
        updatedAt: { gte: todayStart },
      },
    })

    return {
      totalReminders: reminders.length,
      activeToday,
      completedToday: completedMessages,
      upcomingCount: reminders.length - completedMessages,
    }
  }

  async pauseReminder(reminderId: string, userId: string): Promise<Reminder> {
    return this.update({
      where: { id: reminderId },
      data: { notificationDays: [] },
      userId,
    })
  }

  async duplicateReminder(reminderId: string, userId: string): Promise<Reminder> {
    const original = await this.findOneOrFail({ id: reminderId }, userId)

    return this.create(
      { id: userId },
      {
        text: `${original.text} (copy)`,
        notificationTime: original.notificationTime,
        notificationDays: original.notificationDays,
        timeZone: original.timeZone,
      }
    )
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendReminders(): Promise<void> {
    const trackingId = generateTrackingId()
    const now = new Date()

    this.logger.log(`[${trackingId}] Running scheduled reminder check at ${formatDateForLog(now)}`)

    const remindersToCheck = await this.db.reminder.findMany({
      where: {
        notificationTime: getNotificationTime(now),
      },
    })

    const remindersToSend = remindersToCheck.filter((reminder) => {
      const userLocalNow = utcToZonedTime(now, reminder.timeZone)
      return reminder.notificationDays.includes(userLocalNow.getDay())
    })

    this.logger.log(
      `[${trackingId}] Found ${remindersToCheck.length} reminders matching time, ` +
        `${remindersToSend.length} active for today`
    )

    for (const reminder of remindersToSend) {
      const reminderTrackingId = generateTrackingId()
      this.logger.log(
        `[${reminderTrackingId}] Sending reminder ${reminder.id} (${reminder.emoji}) ` +
          `at ${formatDateForLog(now)}`
      )

      try {
        await this.messageService.create(reminder.id)
        this.logger.log(`[${reminderTrackingId}] Successfully queued message for reminder: ${reminder.id}`)
      } catch (error) {
        this.logger.error(
          `[${reminderTrackingId}] Failed to create message for reminder ${reminder.id}: ${error.message}`
        )
      }
    }
  }

  async countByUser(userId: string): Promise<number> {
    return this.db.reminder.count({ where: { userId } })
  }

  async findByEmoji(userId: string, emoji: string): Promise<Reminder | null> {
    return this.db.reminder.findFirst({
      where: { userId, emoji },
    })
  }
}
