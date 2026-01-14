import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { utcToZonedTime } from 'date-fns-tz'

import { Reminder, Prisma, User } from '@prisma/client'
import { MessageService } from '../message/message.service'
import { DatabaseService } from '../database/database.service'
import { emojis } from '../constants'
import { getNotificationTime } from '../utils'

const getNextIndex = (reminders: Reminder[]): number => {
  const lastEmoji = reminders[reminders.length - 1].emoji
  const lastEmojiIndex = emojis.indexOf(lastEmoji)
  return lastEmojiIndex < 0 ? 0 : (lastEmojiIndex + 1) % emojis.length
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly messageService: MessageService
  ) {}

  async create(user, data: Prisma.ReminderCreateInput): Promise<Reminder> {
    const currentUser: User = await this.db.user.findUnique({
      where: { id: user.id },
      include: { reminders: true },
    })

    if (!currentUser.activeSubscription && currentUser.reminders.length) {
      throw new Error('Need an active subscription for more reminders')
    }

    const currentReminders = currentUser.reminders

    const idx = currentReminders.length
      ? getNextIndex(currentReminders)
      : (Math.random() * emojis.length) | 0
      
    this.logger.log(
      `Creating reminder...${
        data.notificationTime
      } stored as ${getNotificationTime(new Date(data.notificationTime))} , ${
        data.notificationDays
      }}`
    )

    return this.db.reminder.create({
      data: {
        ...data,
        emoji: emojis[idx],
        notificationTime: getNotificationTime(new Date(data.notificationTime)),
        user: {
          connect: { id: user.id },
        },
      },
    })
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
    return reminder.userId === userId ? reminder : null
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
    this.logger.log(
      `Updating reminder ${where.id} with ${JSON.stringify(data)}`
    )
    return this.db.reminder.update({
      where: {
        id: where.id,
        userId,
      },
      data,
    })
  }

  async remove(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder> {
    this.logger.log(`Removing reminder ${where.id}`)

    // Prisma doesn't support cascading deletes so we'll delete messages manually
    try {
      await this.db.message.deleteMany({
        where: {
          reminderId: where.id,
        },
      })
    } catch (e) {
      this.logger.error(
        `Failed to delete messages for reminder ${where.id} `
      )
    }

    return this.db.reminder.delete({
      where: {
        id: where.id,
        userId,
      },
    })
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

    await Promise.all(
      remindersToSend.map(async (reminder) => {
        this.logger.log(
          `Sending reminder to ${reminder.emoji} ${
            reminder.id
          } at time ${getNotificationTime(now)}`
        )
        await this.messageService.create(reminder.id)
      })
    )
  }
}
