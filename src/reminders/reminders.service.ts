import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { utcToZonedTime } from 'date-fns-tz'

import { Reminder, Prisma, User } from '@prisma/client'
import { MessageService } from '../message/message.service'
import { DatabaseService } from '../database/database.service'
import { emojis, REMINDER_STATUS, DEFAULT_CONFIG } from '../constants'
import { getNotificationTime, calculateStreak } from '../utils'

export interface ReminderStats {
  totalReminders: number
  activeReminders: number
  completedToday: number
  currentStreak: number
  longestStreak: number
}

export interface ReminderWithStats extends Reminder {
  completionRate: number
  streak: number
}

const getNextIndex = (reminders: Reminder[]): number => {
  const lastEmoji = reminders[reminders.length - 1].emoji
  const lastEmojiIndex = emojis.indexOf(lastEmoji)
  return lastEmojiIndex < 0 ? 0 : (lastEmojiIndex + 1) % emojis.length
}

const calculateCompletionRate = (completed: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly messageService: MessageService
  ) {}

  async create(user, data: Prisma.ReminderCreateInput): Promise<Reminder> {
    const currentReminders = await this.findAll(user.id)

    const currentUser: User = await this.db.user.findUnique({
      where: { id: user.id },
    })

    if (!currentUser) {
      throw new NotFoundException('User not found')
    }

    if (!currentUser.activeSubscription && currentReminders.length) {
      throw new ForbiddenException('Need an active subscription for more reminders')
    }

    if (currentReminders.length >= DEFAULT_CONFIG.maxRemindersPerUser) {
      throw new ForbiddenException(`Maximum of ${DEFAULT_CONFIG.maxRemindersPerUser} reminders allowed`)
    }

    const idx = currentReminders.length
      ? getNextIndex(currentReminders)
      : (Math.random() * emojis.length) | 0

    this.logger.log(
      `Creating reminder for user ${user.id}: ${
        data.notificationTime
      } stored as ${getNotificationTime(new Date(data.notificationTime))}, days: ${
        data.notificationDays
      }`
    )

    const reminder = await this.db.reminder.create({
      data: {
        ...data,
        emoji: emojis[idx],
        notificationTime: getNotificationTime(new Date(data.notificationTime)),
        user: {
          connect: { id: user.id },
        },
      },
    })

    this.logger.log(`Created reminder ${reminder.id} with emoji ${reminder.emoji}`)
    return reminder
  }

  async findAll(userId: string): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: {
        userId,
      },
    })
  }

  async findOne(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder | null> {
    const reminder = await this.db.reminder.findUnique({ where })
    if (!reminder) {
      throw new NotFoundException('Reminder not found')
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenException('Access denied to this reminder')
    }
    return reminder
  }

  async getStats(userId: string): Promise<ReminderStats> {
    const reminders = await this.findAll(userId)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const messages = await this.db.message.findMany({
      where: {
        reminder: {
          userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const completedMessages = messages.filter(m => m.completed)
    const completedToday = completedMessages.filter(m => {
      const msgDate = new Date(m.createdAt)
      msgDate.setHours(0, 0, 0, 0)
      return msgDate.getTime() === today.getTime()
    }).length

    const completionDates = completedMessages.map(m => new Date(m.createdAt))
    const currentStreak = calculateStreak(completionDates)

    return {
      totalReminders: reminders.length,
      activeReminders: reminders.filter(r => r.active).length,
      completedToday,
      currentStreak,
      longestStreak: currentStreak, // TODO: Track longest streak in DB
    }
  }

  async pause(id: string, userId: string): Promise<Reminder> {
    const reminder = await this.findOne({ id }, userId)
    this.logger.log(`Pausing reminder ${id}`)
    return this.db.reminder.update({
      where: { id },
      data: { active: false },
    })
  }

  async resume(id: string, userId: string): Promise<Reminder> {
    const reminder = await this.findOne({ id }, userId)
    this.logger.log(`Resuming reminder ${id}`)
    return this.db.reminder.update({
      where: { id },
      data: { active: true },
    })
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
    const reminder = await this.db.reminder.findUnique({ where })
    if (!reminder) {
      throw new NotFoundException('Reminder not found')
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenException('Access denied to this reminder')
    }

    // Normalize notification time if provided
    if (data.notificationTime) {
      data.notificationTime = getNotificationTime(new Date(data.notificationTime as string))
    }

    this.logger.log(
      `Updating reminder ${reminder.id} with ${JSON.stringify(data)}`
    )
    return this.db.reminder.update({ where, data })
  }

  async remove(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder> {
    const reminder = await this.db.reminder.findUnique({ where })
    if (!reminder) {
      throw new NotFoundException('Reminder not found')
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenException('Access denied to this reminder')
    }

    // Prisma doesn't support cascading deletes so we'll delete messages manually
    try {
      const deletedMessages = await this.db.message.deleteMany({
        where: {
          reminderId: reminder.id,
        },
      })
      this.logger.log(`Deleted ${deletedMessages.count} messages for reminder ${reminder.id}`)
    } catch (e) {
      this.logger.error(
        `Failed to delete messages for reminder ${reminder.id}: ${e.message}`
      )
    }

    this.logger.log(`Removing reminder ${reminder.id}`)

    return this.db.reminder.delete({
      where: {
        id: where.id,
      },
    })
  }

  async bulkPause(userId: string): Promise<number> {
    const result = await this.db.reminder.updateMany({
      where: { userId },
      data: { active: false },
    })
    this.logger.log(`Paused ${result.count} reminders for user ${userId}`)
    return result.count
  }

  async bulkResume(userId: string): Promise<number> {
    const result = await this.db.reminder.updateMany({
      where: { userId },
      data: { active: true },
    })
    this.logger.log(`Resumed ${result.count} reminders for user ${userId}`)
    return result.count
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendReminders() {
    const now = new Date()

    let remindersToSend = await this.db.reminder.findMany({
      where: {
        notificationTime: getNotificationTime(now),
      },
    })

    remindersToSend = remindersToSend.filter((reminder) => {
      const userLocalNow = utcToZonedTime(now, reminder.timeZone)
      return reminder.notificationDays.includes(userLocalNow.getDay())
    })

    this.logger.log(`Found ${remindersToSend.length} reminders to send`)

    remindersToSend.forEach((reminder) => {
      this.logger.log(
        `Sending reminder to ${reminder.emoji} ${
          reminder.id
        } at time ${getNotificationTime(now)}`
      )
      this.messageService.create(reminder.id)
    })
  }
}
