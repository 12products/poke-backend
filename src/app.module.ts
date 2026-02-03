// Root application module - the heart of the Poke backend
// This module ties together all feature modules and configurations
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { APP_GUARD } from '@nestjs/core'

// Feature module imports
// Each module encapsulates related functionality
import { RemindersModule } from './reminders/reminders.module'
import { UsersModule } from './users/users.module'
import { AppController } from './app.controller'
import { MessageModule } from './message/message.module'
import { TwilioModule } from './twilio/twilio.module'
import { AuthModule } from './auth/auth.module'
import { SubscriptionsModule } from './subscriptions/subscriptions.module'
import { PokeAuthGuard } from './auth/auth.guard'

// The main application module decorator
// Configures all dependencies and providers
@Module({
  imports: [
    // Global configuration module - makes env vars available everywhere
    ConfigModule.forRoot({ isGlobal: true }),
    // Schedule module for cron jobs and recurring tasks
    ScheduleModule.forRoot(),
    // Core feature modules
    RemindersModule, // Handles reminder CRUD operations
    UsersModule, // User management functionality
    MessageModule, // SMS message handling
    TwilioModule, // Twilio integration for SMS
    AuthModule, // Authentication and authorization
    SubscriptionsModule, // Apple subscription management
  ],
  controllers: [AppController], // Root controller for health checks
  providers: [
    // Global authentication guard - protects all routes by default
    {
      provide: APP_GUARD,
      useClass: PokeAuthGuard,
    },
  ],
})
// Export the root module class
export class AppModule {}
