import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'

import { Message } from '@prisma/client'
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
  }

  async receiveMessage(req) {
    const userResponse = req.body.Body

    return await this.twilio.respondMessage(userResponse)
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
