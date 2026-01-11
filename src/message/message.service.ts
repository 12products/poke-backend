import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Message, Prisma } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { TwilioService } from '../twilio/twilio.service'
import { getNotificationTime, getNextSendTime, generateTrackingId } from '../utils'
import { motivationalMessages, RETRY_ATTEMPTS } from '../constants'

const getRandomMotivation = (): string => {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
}

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)
  private messagesSentToday = 0

  constructor(
    private readonly db: DatabaseService,
    private twilio: TwilioService
  ) {}

  getStats() {
    return {
      messagesSentToday: this.messagesSentToday,
      lastReset: new Date().toISOString().split('T')[0],
    }
  }

  async create(reminderId: string): Promise<Message> {
    // //if message still exists, remove before creating new one
    const hasMessage: Message | null = await this.findOne({ reminderId })

    if (hasMessage) {
      await this.remove({ reminderId })
    }

    const nextSend = getNextSendTime(new Date(), 1)
    this.logger.log(
      `Creating message for reminder ${reminderId}, next send time ${nextSend}`
    )
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
    const trackingId = generateTrackingId()
    this.logger.log(`[${trackingId}] Preparing to send message for reminder ${reminderId}`)

    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
      include: {
        user: true,
      },
    })

    if (!reminder || !reminder.user) {
      this.logger.warn(`[${trackingId}] Reminder or user not found for ${reminderId}`)
      return null
    }

    const motivation = getRandomMotivation()
    const messageBody = `${reminder.text}.\n\n${motivation}\n\nRespond with ${reminder.emoji} to acknowledge this poke!`

    const response = await this.twilio.sendMessage(messageBody, reminder.user.phone)

    this.messagesSentToday++
    this.logger.log(
      `[${trackingId}] Message sent to ${reminderId}, response from twilio: ${response?.sid || 'unknown'}`
    )
    return response
  }

  async receiveMessage(req) {
    this.logger.log(`Received message from user: ${req.body.Body}`)

    let pokeResponse = `We'll give you another poke in a bit!`

    const userResponse = req.body.Body.trim()
    const user = await this.db.user.findUnique({
      where: { phone: req.body.From.replace('+', '') },
      include: {
        reminders: true,
      },
    })

    if (!user) {
      return
    }

    for (const reminder of user.reminders) {
      if (reminder.emoji === userResponse) {
        this.remove({ reminderId: reminder.id })
        pokeResponse = 'Great work!'
        break
      }
    }

    this.logger.log(`Received message from user ${user.id}`)
    this.logger.log(`Responding with: ${pokeResponse}`)

    return await this.twilio.respondToMessage(pokeResponse)
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async resendMessage() {
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

    this.logger.log(`Found ${allMessages.length} messages to send`)

    for (const message of allMessages) {
      try {
        await this.sendMessage(message.reminder.id)
        const nextSend = getNextSendTime(new Date(), message.tries)
        const active = message.tries < RETRY_ATTEMPTS

        this.logger.log(
          `Resending message ${message.id} with tries ${message.tries} that matches nextSend of ${getNotificationTime(new Date())}`
        )

        await this.update({
          where: { id: message.id },
          data: { nextSend, tries: message.tries + 1, active },
        })
      } catch (error) {
        this.logger.error(`Failed to resend message ${message.id}: ${error.message}`)
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  resetDailyStats() {
    this.logger.log(`Resetting daily stats. Messages sent today: ${this.messagesSentToday}`)
    this.messagesSentToday = 0
  }
}
