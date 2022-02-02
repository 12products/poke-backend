import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Reminder, Prisma, User } from '@prisma/client'
import { MessageService } from '../message/message.service'
import { DatabaseService } from '../database/database.service'
import { emojis } from '../constants'
import { getNotificationTime } from '../utils'

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly messageService: MessageService
  ) {}

  async create(user, data: Prisma.ReminderCreateInput): Promise<Reminder> {
    const reminderCount = await this.db.reminder.count({
      where: {
        user: { id: user.id },
      },
    })

    const currentUser: User = await this.db.user.findUnique({
      where: { id: user.id },
    })

    if (!currentUser.activeSubscription && reminderCount) {
      throw new Error('Need an active subscription for more reminders')
    }

    const idx = reminderCount % emojis.length
    this.logger.log(
      `Creating reminder... Cuurrently has ${reminderCount} count, currentUser ${currentUser.name}`
    )
    return this.db.reminder.create({
      data: {
        ...data,
        emoji: emojis[idx],
        notificationTime: getNotificationTime(data.notificationTime),
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
    const reminder = await this.db.reminder.findUnique({ where })
    if (reminder.userId !== userId) return
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
    if (reminder.userId !== userId) return
    this.logger.log(`Removing reminder ${reminder.id}`)
    return this.db.reminder.delete({
      where: {
        id: where.id,
      },
    })
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders() {
    const now = new Date()

    const remindersToSend = await this.db.reminder.findMany({
      where: {
        notificationTime: getNotificationTime(now),
        notificationDays: {
          has: now.getDay(),
        },
      },
    })

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
