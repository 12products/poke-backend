import { Module } from '@nestjs/common'

import { MessageService } from './message.service'
import { MessageController } from './message.controller'
import { DatabaseModule } from '../database/database.module'
import { TwilioModule } from '../twilio/twilio.module'

@Module({
  imports: [DatabaseModule, TwilioModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
