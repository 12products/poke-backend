import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Message, Prisma } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { TwilioService } from '../twilio/twilio.service'
import { getNotificationTime, getNextSendTime } from '../utils'

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)

  constructor(
    private readonly db: DatabaseService,
    private twilio: TwilioService
  ) {}

  async create(reminderId: string): Promise<Message> {
    // //if message still exists, remove before creating new one
    const hasMessage: Message | null = await this.findOne({ reminderId })

    if (hasMessage) {
      await this.remove({ reminderId })
    }
    // update nextSend time to 1 hour from now
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

    const response = await this.twilio.sendMessage(
      reminder.text,
      reminder.user.phone
    )

    return response
  }

  async receiveMessage(req) {
    let pokeResponse = `We'll give you another poke in a bit!`
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

    // Finds all messages with nextSend time as now
    const allMessages = await this.db.message.findMany({
      where: {
        AND: [
          {
            nextSend: {
              lte: getNotificationTime(new Date()),
            },
          },
          {
            active: true,
          },
        ],
      },

      include: {
        reminder: true,
      },
    })

    allMessages.forEach(async (message) => {
      await this.sendMessage(message.reminder.id)
      const nextSend = getNextSendTime(new Date(), message.tries)
      const active = message.tries <= 4
      await this.update({
        where: { id: message.id },
        data: { nextSend, tries: message.tries + 1, active },
      })
    })
  }
}
