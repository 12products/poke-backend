import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)

  @Cron(CronExpression.EVERY_5_MINUTES)
  sendMessage() {
    this.logger.log('Send message')
  }
}
