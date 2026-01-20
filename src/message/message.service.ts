import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Message, Prisma } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { TwilioService } from '../twilio/twilio.service'
import {
  getNotificationTime,
  getNextSendTime,
  formatDateForLog,
  generateTrackingId,
  shouldRemainActive,
} from '../utils'
import { MESSAGE_TEMPLATES, MAX_RETRY_ATTEMPTS } from '../constants'

export interface MessageStats {
  totalMessages: number
  activeMessages: number
  deliveredMessages: number
  failedMessages: number
}

export interface MessageDeliveryResult {
  success: boolean
  messageId: string
  trackingId: string
  timestamp: Date
  error?: string
}

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly twilio: TwilioService
  ) {}

  async create(reminderId: string): Promise<Message> {
    const trackingId = generateTrackingId()
    this.logger.log(`[${trackingId}] Creating message for reminder: ${reminderId}`)

    const existingMessage: Message | null = await this.findOne({ reminderId })

    if (existingMessage) {
      this.logger.log(`[${trackingId}] Removing existing message for reminder: ${reminderId}`)
      await this.remove({ reminderId })
    }

    const nextSend = getNextSendTime(new Date(), 1)
    this.logger.log(
      `[${trackingId}] Next send time: ${formatDateForLog(nextSend)}`
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

    await this.sendMessage(reminderId, trackingId)

    return message
  }

  async update({
    where,
    data,
  }: {
    where: Prisma.MessageWhereUniqueInput
    data: Prisma.MessageUpdateInput
  }): Promise<Message> {
    this.logger.debug(`Updating message: ${JSON.stringify(where)}`)
    return this.db.message.update({ where, data })
  }

  async remove(where: Prisma.MessageWhereUniqueInput): Promise<Message> {
    this.logger.debug(`Removing message: ${JSON.stringify(where)}`)
    return this.db.message.delete({ where })
  }

  async findAll(): Promise<Message[]> {
    return this.db.message.findMany()
  }

  async findAllActive(): Promise<Message[]> {
    return this.db.message.findMany({
      where: { active: true },
      include: { reminder: true },
    })
  }

  async findOne(
    where: Prisma.MessageWhereUniqueInput
  ): Promise<Message | null> {
    return await this.db.message.findUnique({ where })
  }

  async findByReminderId(reminderId: string): Promise<Message | null> {
    return this.db.message.findUnique({ where: { reminderId } })
  }

  async sendMessage(
    reminderId: string,
    trackingId?: string
  ): Promise<MessageDeliveryResult> {
    const tid = trackingId || generateTrackingId()
    this.logger.log(`[${tid}] Sending message for reminder: ${reminderId}`)

    try {
      const reminder = await this.db.reminder.findUnique({
        where: { id: reminderId },
        include: { user: true },
      })

      if (!reminder) {
        throw new BadRequestException(`Reminder not found: ${reminderId}`)
      }

      if (!reminder.user?.phone) {
        throw new BadRequestException(`User has no phone number configured`)
      }

      const messageText = MESSAGE_TEMPLATES.POKE_REMINDER(
        reminder.text,
        reminder.emoji
      )

      const response = await this.twilio.sendMessage(messageText, reminder.user.phone)

      this.logger.log(
        `[${tid}] Message sent successfully to ${reminderId}, Twilio SID: ${response.sid}`
      )

      return {
        success: true,
        messageId: response.sid,
        trackingId: tid,
        timestamp: new Date(),
      }
    } catch (error) {
      this.logger.error(`[${tid}] Failed to send message: ${error.message}`)
      return {
        success: false,
        messageId: '',
        trackingId: tid,
        timestamp: new Date(),
        error: error.message,
      }
    }
  }

  async receiveMessage(req): Promise<string> {
    const trackingId = generateTrackingId()
    this.logger.log(`[${trackingId}] Received SMS from: ${req.body.From}`)

    const userResponse = req.body.Body?.trim()
    if (!userResponse) {
      this.logger.warn(`[${trackingId}] Empty message body received`)
      return await this.twilio.respondToMessage(MESSAGE_TEMPLATES.POKE_AGAIN)
    }

    this.logger.log(`[${trackingId}] Message content: "${userResponse}"`)

    const phone = req.body.From.replace('+', '')
    const user = await this.db.user.findUnique({
      where: { phone },
      include: { reminders: true },
    })

    if (!user) {
      this.logger.warn(`[${trackingId}] No user found for phone: ${phone}`)
      return await this.twilio.respondToMessage(
        "Sorry, we couldn't find your account."
      )
    }

    let pokeResponse = MESSAGE_TEMPLATES.POKE_AGAIN
    let matchedReminder = null

    for (const reminder of user.reminders) {
      if (reminder.emoji === userResponse) {
        matchedReminder = reminder
        break
      }
    }

    if (matchedReminder) {
      try {
        await this.remove({ reminderId: matchedReminder.id })
        pokeResponse = MESSAGE_TEMPLATES.POKE_SUCCESS
        this.logger.log(
          `[${trackingId}] User ${user.id} acknowledged reminder: ${matchedReminder.id}`
        )
      } catch (error) {
        this.logger.error(
          `[${trackingId}] Failed to remove message: ${error.message}`
        )
      }
    } else {
      this.logger.log(
        `[${trackingId}] No matching emoji found for user ${user.id}`
      )
    }

    this.logger.log(`[${trackingId}] Responding with: "${pokeResponse}"`)
    return await this.twilio.respondToMessage(pokeResponse)
  }

  async getMessageStats(): Promise<MessageStats> {
    const [total, active] = await Promise.all([
      this.db.message.count(),
      this.db.message.count({ where: { active: true } }),
    ])

    const delivered = await this.db.message.count({
      where: { active: false },
    })

    return {
      totalMessages: total,
      activeMessages: active,
      deliveredMessages: delivered,
      failedMessages: total - active - delivered,
    }
  }

  async deactivateExpiredMessages(): Promise<number> {
    const expiredMessages = await this.db.message.findMany({
      where: {
        active: true,
        tries: { gte: MAX_RETRY_ATTEMPTS },
      },
    })

    let deactivatedCount = 0
    for (const message of expiredMessages) {
      await this.update({
        where: { id: message.id },
        data: { active: false },
      })
      deactivatedCount++
    }

    if (deactivatedCount > 0) {
      this.logger.log(`Deactivated ${deactivatedCount} expired messages`)
    }

    return deactivatedCount
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async resendMessage(): Promise<void> {
    const now = new Date()
    const trackingId = generateTrackingId()

    this.logger.debug(`[${trackingId}] Running resend job at ${formatDateForLog(now)}`)

    const messagesToResend = await this.db.message.findMany({
      where: {
        AND: [
          { nextSend: { lte: getNotificationTime(now) } },
          { active: true },
        ],
      },
      include: { reminder: true },
    })

    this.logger.log(`[${trackingId}] Found ${messagesToResend.length} messages to resend`)

    for (const message of messagesToResend) {
      const messageTrackingId = generateTrackingId()

      try {
        await this.sendMessage(message.reminder.id, messageTrackingId)

        const nextSend = getNextSendTime(now, message.tries)
        const active = shouldRemainActive(message.tries + 1)

        this.logger.log(
          `[${messageTrackingId}] Resending message ${message.id}, ` +
            `tries: ${message.tries}, next: ${formatDateForLog(nextSend)}, ` +
            `will remain active: ${active}`
        )

        await this.update({
          where: { id: message.id },
          data: {
            nextSend,
            tries: message.tries + 1,
            active,
          },
        })

        if (!active) {
          this.logger.log(
            `[${messageTrackingId}] Message ${message.id} reached max retries, deactivating`
          )
        }
      } catch (error) {
        this.logger.error(
          `[${messageTrackingId}] Failed to resend message ${message.id}: ${error.message}`
        )
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredMessages(): Promise<void> {
    const trackingId = generateTrackingId()
    this.logger.log(`[${trackingId}] Running cleanup job`)

    const count = await this.deactivateExpiredMessages()
    this.logger.log(`[${trackingId}] Cleanup complete, deactivated ${count} messages`)
  }
}
