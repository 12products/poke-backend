// Subscriptions Controller
// Handles HTTP endpoints for subscription management
// Used for Apple In-App Purchase verification
import { Controller, Post, Delete, Body } from '@nestjs/common'
import { SubscriptionsService } from './subscriptions.service'
import { AuthUser } from '@supabase/supabase-js'

import { CurrentUser } from '../auth/current-user.decorator'

// Routes prefixed with /v1/subscriptions
@Controller('subscriptions')
export class SubscriptionsController {
  // Inject the subscriptions service
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // POST /v1/subscriptions
  // Verify an Apple receipt and activate subscription
  // Called after a successful in-app purchase
  @Post()
  create(@Body() subscriptionReceipt: string, @CurrentUser() user: AuthUser) {
    // Verify the receipt with Apple and update user's subscription status
    return this.subscriptionsService.create(user, subscriptionReceipt)
  }

  // DELETE /v1/subscriptions
  // Cancel/remove a user's subscription
  // Called when subscription expires or user cancels
  @Delete()
  delete(@CurrentUser() user: AuthUser) {
    // Remove the active subscription from the user
    return this.subscriptionsService.delete(user)
  }
}
