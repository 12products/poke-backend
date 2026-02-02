import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Message, Prisma } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { TwilioService } from '../twilio/twilio.service'
import { getNotificationTime, getNextSendTime } from '../utils'

export interface MessageStats {
  total: number
  active: number
  pending: number
  delivered: number
  failed: number
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: Date
}

const MAX_RETRY_ATTEMPTS = 4
const BATCH_SIZE = 50

@Injectable()
export class MessageService implements OnModuleInit {
  private readonly logger = new Logger(MessageService.name)
  private isProcessing = false

  constructor(
    private readonly db: DatabaseService,
    private twilio: TwilioService
  ) {}

  async onModuleInit() {
    const stats = await this.getStats()
    this.logger.log(
      `MessageService initialized. Active messages: ${stats.active}, Pending: ${stats.pending}`
    )
  }

  async getStats(): Promise<MessageStats> {
    const [total, active, pending] = await Promise.all([
      this.db.message.count(),
      this.db.message.count({ where: { active: true } }),
      this.db.message.count({
        where: {
          active: true,
          nextSend: { lte: new Date() },
        },
      }),
    ])

    return {
      total,
      active,
      pending,
      delivered: total - active,
      failed: 0,
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

  async sendMessage(reminderId: string): Promise<SendResult> {
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
      include: {
        user: true,
      },
    })

    if (!reminder) {
      this.logger.warn(`Reminder ${reminderId} not found`)
      return {
        success: false,
        error: 'Reminder not found',
        timestamp: new Date(),
      }
    }

    if (!reminder.user?.phone) {
      this.logger.warn(`User ${reminder.userId} has no phone number`)
      return {
        success: false,
        error: 'User has no phone number',
        timestamp: new Date(),
      }
    }

    try {
      const messageText = this.formatMessage(reminder.text, reminder.emoji)
      const response = await this.twilio.sendMessage(
        messageText,
        reminder.user.phone
      )

      this.logger.log(
        `Message sent to ${reminderId}, response from twilio: ${response}`
      )

      return {
        success: true,
        messageId: response,
        timestamp: new Date(),
      }
    } catch (error) {
      this.logger.error(`Failed to send message for ${reminderId}: ${error.message}`)
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      }
    }
  }

  private formatMessage(text: string, emoji: string): string {
    return `${text}.\n\nRespond with ${emoji} to acknowledge this poke!`
  }

  async cancelPendingMessages(reminderId: string): Promise<number> {
    const result = await this.db.message.updateMany({
      where: {
        reminderId,
        active: true,
      },
      data: {
        active: false,
      },
    })

    this.logger.log(`Cancelled ${result.count} pending messages for reminder ${reminderId}`)
    return result.count
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
    if (this.isProcessing) {
      this.logger.debug('Already processing messages, skipping this cycle')
      return
    }

    this.isProcessing = true

    try {
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
        take: BATCH_SIZE,
        orderBy: {
          nextSend: 'asc',
        },
      })

      if (allMessages.length === 0) {
        this.logger.debug('No messages to send')
        return
      }

      this.logger.log(`Processing ${allMessages.length} messages`)

      const results = await Promise.allSettled(
        allMessages.map(async (message) => {
          const result = await this.sendMessage(message.reminder.id)
          const nextSend = getNextSendTime(new Date(), message.tries)
          const active = message.tries < MAX_RETRY_ATTEMPTS

          this.logger.log(
            `Resending message ${message.id} (attempt ${message.tries + 1}/${MAX_RETRY_ATTEMPTS}), ` +
            `next send: ${nextSend.toISOString()}, active: ${active}`
          )

          await this.update({
            where: { id: message.id },
            data: {
              nextSend,
              tries: message.tries + 1,
              active,
            },
          })

          return result
        })
      )

      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      this.logger.log(`Batch complete: ${successful} successful, ${failed} failed`)
    } catch (error) {
      this.logger.error(`Error processing messages: ${error.message}`)
    } finally {
      this.isProcessing = false
    }
  }

  async getMessageHistory(
    reminderId: string,
    limit = 10
  ): Promise<Message[]> {
    return this.db.message.findMany({
      where: { reminderId },
      orderBy: { nextSend: 'desc' },
      take: limit,
    })
  }
}
