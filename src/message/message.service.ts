import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Message, Prisma } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { TwilioService } from '../twilio/twilio.service'
import { getNotificationTime, getNextSendTime, sanitizeInput } from '../utils'
import { RESPONSE_MESSAGES, MAX_RETRY_ATTEMPTS } from '../constants'

export interface MessageStats {
  totalSent: number
  pendingRetries: number
  acknowledgedToday: number
}

export interface MessageWithReminder extends Message {
  reminder: {
    id: string
    text: string
    emoji: string
    userId: string
  }
}

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
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
      include: {
        user: true,
      },
    })

    const response = await this.twilio.sendMessage(
      `${reminder.text}.\n\nRespond with ${reminder.emoji} to acknowledge this poke!`,
      reminder.user.phone
    )
    this.logger.log(
      `Message sending to ${reminderId}, response from twillio ${response}`
    )
    return response
  }

  async receiveMessage(req) {
    this.logger.log(`Received message from user: ${req.body.Body}`)

    let pokeResponse = RESPONSE_MESSAGES.RETRY

    const userResponse = sanitizeInput(req.body.Body.trim())
    const user = await this.db.user.findUnique({
      where: { phone: req.body.From.replace('+', '') },
      include: {
        reminders: true,
      },
    })

    if (!user) {
      this.logger.warn(`No user found for phone: ${req.body.From}`)
      return
    }

    for (const reminder of user.reminders) {
      if (reminder.emoji === userResponse) {
        this.remove({ reminderId: reminder.id })
        pokeResponse = RESPONSE_MESSAGES.SUCCESS
        this.logger.log(`Reminder ${reminder.id} acknowledged by user ${user.id}`)
        break
      }
    }

    this.logger.log(`Received message from user ${user.id}`)
    this.logger.log(`Responding with: ${pokeResponse}`)

    return await this.twilio.respondToMessage(pokeResponse)
  }

  async getMessageStats(): Promise<MessageStats> {
    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))

    const [totalSent, pendingRetries] = await Promise.all([
      this.db.message.count(),
      this.db.message.count({
        where: {
          active: true,
          tries: { lt: MAX_RETRY_ATTEMPTS },
        },
      }),
    ])

    return {
      totalSent,
      pendingRetries,
      acknowledgedToday: 0, // Would need to track acknowledgments
    }
  }

  async getActiveMessages(): Promise<MessageWithReminder[]> {
    return this.db.message.findMany({
      where: { active: true },
      include: {
        reminder: {
          select: {
            id: true,
            text: true,
            emoji: true,
            userId: true,
          },
        },
      },
    }) as Promise<MessageWithReminder[]>
  }

  async cancelMessage(reminderId: string, userId: string): Promise<boolean> {
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
    })

    if (!reminder || reminder.userId !== userId) {
      throw new NotFoundException('Reminder not found')
    }

    try {
      await this.remove({ reminderId })
      this.logger.log(`Message for reminder ${reminderId} cancelled by user ${userId}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to cancel message: ${error.message}`)
      return false
    }
  }

  async acknowledgeMessage(messageId: string): Promise<Message | null> {
    const message = await this.findOne({ id: messageId })
    if (!message) return null

    return this.update({
      where: { id: messageId },
      data: { active: false },
    })
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

    allMessages.forEach(async (message) => {
      await this.sendMessage(message.reminder.id)
      const nextSend = getNextSendTime(new Date(), message.tries)
      const active = message.tries < 4

      this.logger.log(
        `Resending message ${message.id} with tries ${
          message.tries
        }that matches nextSend of ${getNotificationTime(new Date())} `
      )

      await this.update({
        where: { id: message.id },
        data: { nextSend, tries: message.tries + 1, active },
      })
    })
  }
}
