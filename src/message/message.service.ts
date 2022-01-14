import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Message, Prisma } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { TwilioService } from 'src/twilio/twilio.service'

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)

  constructor(
    private readonly db: DatabaseService,
    private twilio: TwilioService
  ) {}

  async create(reminderId: string): Promise<Message> {
    const message = await this.db.message.create({
      data: {
        reminder: {
          connect: { id: reminderId },
        },
      },
    })

    await this.sendMessage(reminderId)

    return message
  }

  async update({
    where,
    data,
  }: {
    where: Prisma.MessageWhereUniqueInput
    data: Prisma.MessageUpdateInput
  }): Promise<Message> {
    return this.db.message.update({ where, data })
  }

  async remove(where: Prisma.MessageWhereUniqueInput): Promise<Message> {
    return this.db.message.delete({ where })
  }

  async findAll(): Promise<Message[]> {
    return this.db.message.findMany()
  }

  async sendMessage(reminderId: string) {
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
      include: {
        user: true,
      },
    })

    const response = await this.twilio.sendMessage(
      reminder.text,
      reminder.user.phone
    )

    await this.db.reminder.update({
      where: { id: reminderId },
      data: { updatedAt: new Date() },
    })

    return response
  }

  async receiveMessage(req) {
    let pokeResponse = `We'll give you another poke in an hour!`
    const userResponse = req.body.Body.trim()
    const user = await this.db.user.findUnique({
      where: { phone: req.body.From },
      include: {
        reminders: true,
      },
    })

    for (const reminder of user.reminders) {
      if (reminder.emoji === userResponse) {
        this.remove({ reminderId: reminder.id })
        pokeResponse = 'Great work!'
        break
      }
    }

    return await this.twilio.respondToMessage(pokeResponse)
  }

  // @Cron(CronExpression.EVERY_5_MINUTES)
  async resendMessage() {
    this.logger.log('Sending a poke to user')
    // Determines the time 1 hour ago from now
    const reminderTime = new Date()
    reminderTime.setHours(reminderTime.getHours() - 1)
    // Finds all messages where its updated time is less than reminder time, aka updatedan more than 1 hour ago
    const allMessages = await this.db.message.findMany({
      where: {
        updatedAt: {
          lte: reminderTime,
        },
      },
      include: {
        reminder: true,
      },
    })
    // Loop through every existing message and send poke and update updatedAt time
    allMessages.forEach(async (message) => {
      await this.sendMessage(message.reminder.id)
      await this.update({
        where: { id: message.id },
        data: { updatedAt: new Date() },
      })
    })
  }
}
