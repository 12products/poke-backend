import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import * as twilio from 'twilio'

import { Message } from '@prisma/client'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)
  private twilioClient: twilio.Twilio
  private twilioPhone: string

  constructor(
    private readonly db: DatabaseService,
    private configService: ConfigService
  ) {
    const accountID = this.configService.get<string>('TWILIO_ACCOUNT_ID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE')
    this.twilioClient = twilio(accountID, authToken)
  }

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

  async sendMessage(reminderId: string) {
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
    })

    const response = await this.twilioClient.messages.create({
      body: reminder.text,
      from: this.twilioPhone,
      to: '+17786978925',
    })
    console.log({ response })
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  resendMessage() {
    this.logger.log('Sending a poke to user')

    // TODO:
    // Loop through every existing message
    // If one hour has passed since the last message
    // send a poke!
  }
}
