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

    const userResponse = req.body.Body.trim()
    const phoneNumber = req.body.From.replace('+', '')

    const user = await this.db.user.findUnique({
      where: { phone: phoneNumber },
      include: {
        reminders: true,
      },
    })

    if (!user) {
      this.logger.warn(`Received message from unknown phone: ${phoneNumber.slice(-4)}`)
      return await this.twilio.respondToMessage(
        'Sorry, we could not find your account. Please sign up at poke.app'
      )
    }

    // Check for special commands
    if (userResponse.toLowerCase() === 'stop') {
      this.logger.log(`User ${user.id} requested to stop all reminders`)
      return await this.twilio.respondToMessage(
        'You have been unsubscribed. Reply START to resume.'
      )
    }

    if (userResponse.toLowerCase() === 'status') {
      const activeReminders = user.reminders.length
      return await this.twilio.respondToMessage(
        `You have ${activeReminders} active reminder${activeReminders !== 1 ? 's' : ''}.`
      )
    }

    // Check for emoji response matching a reminder
    let pokeResponse = `We'll give you another poke in a bit!`
    let matched = false

    for (const reminder of user.reminders) {
      if (reminder.emoji === userResponse) {
        await this.remove({ reminderId: reminder.id })
        pokeResponse = this.getSuccessMessage()
        matched = true
        this.logger.log(`User ${user.id} completed reminder: ${reminder.id}`)
        break
      }
    }

    if (!matched) {
      this.logger.log(`No matching emoji found for user ${user.id}, response: ${userResponse}`)
    }

    this.logger.log(`Responding to user ${user.id}: ${pokeResponse}`)
    return await this.twilio.respondToMessage(pokeResponse)
  }

  private getSuccessMessage(): string {
    const messages = [
      'Great work! Keep it up!',
      'Awesome job! You crushed it!',
      'Nice! Another goal achieved!',
      'Fantastic! You are on fire!',
      'Well done! Consistency is key!',
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  async getMessageStats(): Promise<{ total: number; active: number; completed: number }> {
    const [total, active] = await Promise.all([
      this.db.message.count(),
      this.db.message.count({ where: { active: true } }),
    ])

    return {
      total,
      active,
      completed: total - active,
    }
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
