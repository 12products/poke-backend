import { Module, NestModule, MiddlewareConsumer, Logger } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core'

import { RemindersModule } from './reminders/reminders.module'
import { UsersModule } from './users/users.module'
import { AppController } from './app.controller'
import { MessageModule } from './message/message.module'
import { TwilioModule } from './twilio/twilio.module'
import { AuthModule } from './auth/auth.module'
import { SubscriptionsModule } from './subscriptions/subscriptions.module'
import { HealthModule } from './health/health.module'
import { PokeAuthGuard } from './auth/auth.guard'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'
import { ThrottleGuard } from './common/guards/throttle.guard'

const loadConfig = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  twilio: {
    accountId: process.env.TWILIO_ACCOUNT_ID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phone: process.env.TWILIO_PHONE,
  },
  apple: {
    sharedSecret: process.env.APPLE_SHARED_SECRET,
  },
  features: {
    enablePremiumFeatures: process.env.ENABLE_PREMIUM_FEATURES === 'true',
    maxFreeReminders: parseInt(process.env.MAX_FREE_REMINDERS || '1', 10),
    maxPremiumReminders: parseInt(process.env.MAX_PREMIUM_REMINDERS || '10', 10),
  },
})

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig],
      cache: true,
    }),
    ScheduleModule.forRoot(),
    RemindersModule,
    UsersModule,
    MessageModule,
    TwilioModule,
    AuthModule,
    SubscriptionsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PokeAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottleGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  private readonly logger = new Logger(AppModule.name)

  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    this.logger.log(
      `Application configured for ${this.configService.get('nodeEnv')} environment`
    )
  }
}
