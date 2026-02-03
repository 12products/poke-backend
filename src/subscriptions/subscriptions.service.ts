// Subscriptions service - Apple In-App Purchase verification
// Handles subscription creation and cancellation
import { Injectable } from '@nestjs/common'
// Supabase user type
import { AuthUser } from '@supabase/supabase-js'
import { ConfigService } from '@nestjs/config'
// Library for verifying Apple App Store receipts
import * as appleReceiptVerify from 'node-apple-receipt-verify'

import { UsersService } from '../users/users.service'

// Injectable service for subscription operations
@Injectable()
export class SubscriptionsService {
  // Apple shared secret for receipt verification
  private appleSharedSecret: string

  // Inject config and users services
  constructor(
    private readonly configService: ConfigService,
    private readonly users: UsersService
  ) {
    // Get Apple shared secret from environment
    this.appleSharedSecret = this.configService.get<string>(
      'APPLE_SHARED_SECRET'
    )
  }

  // Verify an Apple receipt and activate subscription
  // Called after user completes in-app purchase
  async create(user: AuthUser, receipt: string) {
    // Configure the receipt verification library
    appleReceiptVerify.config({
      secret: this.appleSharedSecret,
      // Support both production and sandbox environments
      environment: ['production', 'sandbox'],
    })

    try {
      // Validate the receipt with Apple's servers
      const products = await appleReceiptVerify.validate({ receipt })
      // Extract unique product IDs from the receipt
      const uniqueTransactions = [
        ...new Set(products.map((product) => product.productId)),
      ]

      // If valid products found, activate subscription
      if (uniqueTransactions.length) {
        // Store the first product ID as the active subscription
        await this.users.update({
          where: { id: user.id },
          data: { activeSubscription: uniqueTransactions[0] },
        })
      }
    } catch (e) {
      // Receipt verification failed
      throw new Error(`Failed to verify Apple receipt: ${e}`)
    }

    // Return success indicator
    return 'ok'
  }

  // Cancel a user's subscription
  // Sets activeSubscription to null
  async delete(user: AuthUser) {
    try {
      // Clear the active subscription
      await this.users.update({
        where: { id: user.id },
        data: { activeSubscription: null },
      })
    } catch (e) {
      // Database update failed
      throw new Error(`Failed to cancel the subscription: ${e}`)
    }

    // Return success indicator
    return 'ok'
  }
}
