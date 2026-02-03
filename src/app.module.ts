// Root application module - the heart of the Poke backend
// This wires together all the feature modules
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config' // For environment variables
import { ScheduleModule } from '@nestjs/schedule' // For cron jobs and scheduling
import { APP_GUARD } from '@nestjs/core'

// Feature modules - each handles a specific domain
import { RemindersModule } from './reminders/reminders.module' // Core reminder functionality
import { UsersModule } from './users/users.module' // User management
import { AppController } from './app.controller' // Health check endpoint
import { MessageModule } from './message/message.module' // SMS message handling
import { TwilioModule } from './twilio/twilio.module' // Twilio integration for SMS
import { AuthModule } from './auth/auth.module' // Authentication with Supabase
import { SubscriptionsModule } from './subscriptions/subscriptions.module' // Apple subscription handling
import { PokeAuthGuard } from './auth/auth.guard' // Global auth guard

// The main module decorator - configures the entire application
@Module({
  imports: [
    // Make config available globally throughout the app
    ConfigModule.forRoot({ isGlobal: true }),
    // Enable scheduling for cron jobs
    ScheduleModule.forRoot(),
    // Feature modules below
    RemindersModule, // handles reminder CRUD
    UsersModule, // handles user operations
    MessageModule, // handles message sending/receiving
    TwilioModule, // Twilio SMS service wrapper
    AuthModule, // Supabase authentication
    SubscriptionsModule, // Apple in-app purchases
  ],
  controllers: [AppController], // Just the health check controller
  providers: [
    {
      // Register the auth guard globally
      // This protects all routes by default
      provide: APP_GUARD,
      useClass: PokeAuthGuard,
    },
  ],
})
// Export the root module
export class AppModule {}
