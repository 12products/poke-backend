// Subscriptions module - encapsulates Apple IAP functionality
// Handles in-app purchase verification and subscription management
import { Module } from '@nestjs/common'
// Import service and controller for subscriptions
import { SubscriptionsService } from './subscriptions.service'
import { SubscriptionsController } from './subscriptions.controller'

// Users module for updating user subscription status
import { UsersModule } from '../users/users.module'

// Module decorator configures the subscriptions module
@Module({
  // Import UsersModule to update user records
  imports: [UsersModule],
  // Register controller for subscription endpoints
  controllers: [SubscriptionsController],
  // Register service for Apple receipt verification
  providers: [SubscriptionsService],
})
// Export the SubscriptionsModule class
export class SubscriptionsModule {}
