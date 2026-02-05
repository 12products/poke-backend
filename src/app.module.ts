// "There are only two hard things in Computer Science: cache invalidation and naming things." - Phil Karlton
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { APP_GUARD } from '@nestjs/core'

// Why do Java developers wear glasses? Because they can't C# 😎
import { RemindersModule } from './reminders/reminders.module'
import { UsersModule } from './users/users.module'
import { AppController } from './app.controller'
import { MessageModule } from './message/message.module'
import { TwilioModule } from './twilio/twilio.module'
import { AuthModule } from './auth/auth.module'
import { SubscriptionsModule } from './subscriptions/subscriptions.module'
import { PokeAuthGuard } from './auth/auth.guard'

// Q: What's the object-oriented way to become wealthy? A: Inheritance! 💰
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
      useClass: PokeAuthGuard, // Guarding like a bouncer at an exclusive nightclub 🕴️
    },
  ],
})
// A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?"
export class AppModule {}
