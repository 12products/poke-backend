import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Reminder, Prisma } from '@prisma/client'
import { MessageService } from '../message/message.service'
import { DatabaseService } from '../database/database.service'
import { emojis } from '../constants'
import { getNotificationTime } from 'utils'

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly messageService: MessageService
  ) {}

  async create(user, data: Prisma.ReminderCreateInput): Promise<Reminder> {
    const allUserReminders = await this.db.reminder.count({
      where: {
        user: { id: user.id },
      },
    })

    const idx = allUserReminders % emojis.length

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

    return this.db.reminder.update({ where, data })
  }

  async remove(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder> {
    const reminder = await this.db.reminder.findUnique({ where })
    if (reminder.userId !== userId) return

    return this.db.reminder.delete({
      where: {
        id: where.id,
      },
    })
  }

  // @Cron(CronExpression.EVERY_MINUTE)
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
      this.logger.log(`Sending reminder to ${reminder.emoji} ${reminder.id}`)
      this.messageService.create(reminder.id)
    })
  }
}
