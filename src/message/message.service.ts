import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Message } from '@prisma/client'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)

  constructor(private readonly db: DatabaseService) {}

  async create(reminderId: string): Promise<Message> {
    const message = await this.db.message.create({
      data: {
        reminder: {
          connect: { id: reminderId },
        },
      },
    })

    // TODO: Send text via Twilio

    return message
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
