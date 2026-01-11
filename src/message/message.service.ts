import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Message, Prisma } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { TwilioService } from '../twilio/twilio.service'
import { getNotificationTime, getNextSendTime } from '../utils'

@Injectable()
export class MessageService {
  constructor(
    private readonly db: DatabaseService,
    private twilio: TwilioService
  ) {}

  async create(reminderId: string): Promise<Message> {
    const hasMessage: Message | null = await this.findOne({ reminderId })

    if (hasMessage) {
      await this.remove({ reminderId })
    }

    const nextSend = getNextSendTime(new Date(), 1)
    const message = await this.db.message.create({
      data: {
        reminder: {
          connect: { id: reminderId },
        },
        nextSend,
        active: true,
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

  async findOne(
    where: Prisma.MessageWhereUniqueInput
  ): Promise<Message | null> {
    return await this.db.message.findUnique({ where })
  }

  async sendMessage(reminderId: string) {
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
      include: {
        user: true,
      },
    })

    if (!reminder || !reminder.user) {
      return null
    }

    return await this.twilio.sendMessage(
      `${reminder.text}. Respond with ${reminder.emoji} to acknowledge this poke!`,
      reminder.user.phone
    )
  }

  async receiveMessage(req) {
    let pokeResponse = `We'll give you another poke in a bit!`

    const userResponse = req.body.Body.trim()
    const user = await this.db.user.findUnique({
      where: { phone: req.body.From.replace('+', '') },
      include: { reminders: true },
    })

    if (!user) return

    for (const reminder of user.reminders) {
      if (reminder.emoji === userResponse) {
        this.remove({ reminderId: reminder.id })
        pokeResponse = 'Great work!'
        break
      }
    }

    return await this.twilio.respondToMessage(pokeResponse)
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async resendMessage() {
    const allMessages = await this.db.message.findMany({
      where: {
        AND: [
          { nextSend: { lte: getNotificationTime(new Date()) } },
          { active: true },
        ],
      },
      include: { reminder: true },
    })

    for (const message of allMessages) {
      await this.sendMessage(message.reminder.id)
      const nextSend = getNextSendTime(new Date(), message.tries)

      await this.update({
        where: { id: message.id },
        data: { nextSend, tries: message.tries + 1, active: message.tries < 3 },
      })
    }
  }
}
