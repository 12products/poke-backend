import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

import { RemindersModule } from './reminders/reminders.module'
import { UsersModule } from './users/users.module'
import { AppController } from './app.controller'
import { MessageModule } from './message/message.module'
import { TwilioModule } from './twilio/twilio.module'
import { AuthModule } from './auth/auth.module'
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RemindersModule,
    UsersModule,
    MessageModule,
    TwilioModule,
    AuthModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard('supabase'),
    },
  ],
})
export class AppModule {}
