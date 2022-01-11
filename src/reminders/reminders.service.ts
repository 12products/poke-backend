import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Reminder, Prisma } from '@prisma/client'
import { MessageService } from '../message/message.service'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly messageService: MessageService
  ) {}

  async create(data: Prisma.ReminderCreateInput): Promise<Reminder> {
    return this.db.reminder.create({
      data: {
        ...data,
        user: {
          connect: { id: data.user as string },
        },
      },
    })
  }

  async findAll(): Promise<Reminder[]> {
    return this.db.reminder.findMany()
  }

  async findOne(
    where: Prisma.ReminderWhereUniqueInput
  ): Promise<Reminder | null> {
    return this.db.reminder.findUnique({ where })
  }

  async update({
    where,
    data,
  }: {
    where: Prisma.ReminderWhereUniqueInput
    data: Prisma.ReminderUpdateInput
  }): Promise<Reminder> {
    return this.db.reminder.update({ where, data })
  }

  async remove(where: Prisma.ReminderWhereUniqueInput): Promise<Reminder> {
    return this.db.reminder.delete({ where })
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendReminders() {
    const now = new Date()
    const notificationHour = `${now.getUTCHours()}`.padStart(2, '0')
    const notificationMinutes = `${now.getUTCMinutes()}`.padStart(2, '0')

    const remindersToSend = await this.db.reminder.findMany({
      where: {
        notificationTime: `${notificationHour}:${notificationMinutes}`,
        notificationDays: {
          has: now.getDay(),
        },
      },
    })

    remindersToSend.forEach((reminder) => {
      this.logger.log(`Sending reminder to ${reminder.id}`)
      this.messageService.create(reminder.id)
    })
  }
}
