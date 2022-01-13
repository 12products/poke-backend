import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'

import { RemindersModule } from './reminders/reminders.module'
import { UsersModule } from './users/users.module'
import { AppController } from './app.controller'
import { MessageModule } from './message/message.module'
import { TwilioModule } from './twilio/twilio.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RemindersModule,
    UsersModule,
    MessageModule,
    TwilioModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
