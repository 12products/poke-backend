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

    // Easter egg responses for secret messages!
    const lowerResponse = userResponse.toLowerCase()

    if (userResponse === '🦄' || lowerResponse.includes('unicorn')) {
      this.logger.log('🦄 Easter egg triggered!')
      return await this.twilio.respondToMessage(
        '🦄✨ You found a unicorn! May your day be filled with magic and sparkles! ✨'
      )
    }

    if (userResponse === '🚀' || lowerResponse.includes('rocket') || lowerResponse.includes('to the moon')) {
      this.logger.log('🚀 Easter egg triggered!')
      return await this.twilio.respondToMessage(
        '🚀 To the moon! You\'re on a trajectory to greatness. Keep reaching for the stars! 🌟'
      )
    }

    if (userResponse === '🎉' || lowerResponse === 'party') {
      this.logger.log('🎉 Easter egg triggered!')
      return await this.twilio.respondToMessage(
        '🎉🎊 PARTY TIME! You deserve to celebrate! Keep being awesome! 🥳'
      )
    }

    if (userResponse === '🐉' || lowerResponse.includes('dragon')) {
      this.logger.log('🐉 Easter egg triggered!')
      return await this.twilio.respondToMessage(
        '🐉 You\'ve awakened the dragon! Legendary status unlocked. You\'re unstoppable! 🔥'
      )
    }

    if (lowerResponse === 'konami' || lowerResponse === 'up up down down') {
      this.logger.log('🎮 Konami code easter egg triggered!')
      return await this.twilio.respondToMessage(
        '🎮 ↑↑↓↓←→←→ KONAMI CODE ACTIVATED! You just unlocked 30 extra lives of motivation! 💪'
      )
    }

    if (lowerResponse === '42' || lowerResponse === 'forty two') {
      this.logger.log('42 easter egg triggered!')
      return await this.twilio.respondToMessage(
        '42 - The Answer to Life, the Universe, and Everything. You\'ve found the ultimate truth! 🌌'
      )
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
