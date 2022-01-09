import { Module } from '@nestjs/common'
import { RemindersService } from './reminders.service'
import { RemindersController } from './reminders.controller'

import { DatabaseModule } from '../database/database.module'
import { MessageModule } from '../message/message.module'

@Module({
  imports: [DatabaseModule, MessageModule],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
