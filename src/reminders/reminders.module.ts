import { Module } from '@nestjs/common'
import { RemindersService } from './reminders.service'
import { RemindersController } from './reminders.controller'

import { DatabaseModule } from '../database/database.module'
import { MessageModule } from '../message/message.module'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [DatabaseModule, MessageModule, UsersModule],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
