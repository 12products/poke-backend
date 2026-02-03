// Subscriptions Service
// Handles Apple In-App Purchase subscription verification
// This is how users unlock premium features (multiple reminders)
import { Injectable } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'
import { ConfigService } from '@nestjs/config'
import * as appleReceiptVerify from 'node-apple-receipt-verify' // Apple receipt validation

import { UsersService } from '../users/users.service'

// Injectable service for NestJS dependency injection
@Injectable()
export class SubscriptionsService {
  // Apple's shared secret for receipt validation
  // This is obtained from App Store Connect
  private appleSharedSecret: string

  // Constructor - inject dependencies
  constructor(
    private readonly configService: ConfigService, // For environment variables
    private readonly users: UsersService // To update user records
  ) {
    // Get the Apple shared secret from environment
    this.appleSharedSecret = this.configService.get<string>(
      'APPLE_SHARED_SECRET'
    )
  }

  // Verify an Apple receipt and activate subscription
  // Called when a user makes an in-app purchase
  async create(user: AuthUser, receipt: string) {
    // Configure the receipt verification library
    appleReceiptVerify.config({
      secret: this.appleSharedSecret, // Our shared secret
      environment: ['production', 'sandbox'], // Check both environments
    })

    try {
      // Validate the receipt with Apple's servers
      const products = await appleReceiptVerify.validate({ receipt })

      // Get unique product IDs from the receipt
      // A receipt can contain multiple transactions
      const uniqueTransactions = [
        ...new Set(products.map((product) => product.productId)),
      ]

      // If there are valid transactions, activate the subscription
      if (uniqueTransactions.length) {
        // Update the user's activeSubscription field
        // We store the first product ID as the subscription identifier
        await this.users.update({
          where: { id: user.id },
          data: { activeSubscription: uniqueTransactions[0] },
        })
      }
    } catch (e) {
      // Receipt validation failed - could be invalid or expired
      throw new Error(`Failed to verify Apple receipt: ${e}`)
    }

    // Return success
    return 'ok'
  }

  // Cancel a user's subscription
  // Called when a subscription expires or is cancelled
  async delete(user: AuthUser) {
    try {
      // Set activeSubscription to null to deactivate premium features
      await this.users.update({
        where: { id: user.id },
        data: { activeSubscription: null },
      })
    } catch (e) {
      // Something went wrong updating the user
      throw new Error(`Failed to cancel the subscription: ${e}`)
    }

    // Return success
    return 'ok'
  }
}
