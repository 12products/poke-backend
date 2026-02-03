// Subscriptions controller - REST API for subscription management
// Handles Apple In-App Purchase subscription operations
import { Controller, Post, Delete, Body } from '@nestjs/common'
import { SubscriptionsService } from './subscriptions.service'
// Supabase user type for authentication
import { AuthUser } from '@supabase/supabase-js'

// Custom decorator to get current authenticated user
import { CurrentUser } from '../auth/current-user.decorator'

// Controller handles all /subscriptions routes
@Controller('subscriptions')
export class SubscriptionsController {
  // Inject the subscriptions service
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // POST /subscriptions - Activate a subscription
  // Request body should contain Apple receipt data
  @Post()
  create(@Body() subscriptionReceipt: string, @CurrentUser() user: AuthUser) {
    // Pass receipt to service for verification and activation
    return this.subscriptionsService.create(user, subscriptionReceipt)
  }

  // DELETE /subscriptions - Cancel a subscription
  // Removes active subscription from user account
  @Delete()
  delete(@CurrentUser() user: AuthUser) {
    // Clear the user's subscription
    return this.subscriptionsService.delete(user)
  }
}
