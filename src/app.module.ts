// The app module - the glue that holds everything together
// Like duct tape, but for code
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { APP_GUARD } from '@nestjs/core'

import { RemindersModule } from './reminders/reminders.module'
import { UsersModule } from './users/users.module'
import { AppController } from './app.controller'
import { MessageModule } from './message/message.module'
import { TwilioModule } from './twilio/twilio.module'
import { AuthModule } from './auth/auth.module'
import { SubscriptionsModule } from './subscriptions/subscriptions.module'
import { PokeAuthGuard } from './auth/auth.guard'

// Here we import all the modules like a kid collecting Pokemon cards
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RemindersModule,
    UsersModule,
    MessageModule,
    TwilioModule,
    AuthModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PokeAuthGuard,
    },
  ],
})
export class AppModule {}
