import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'
import { ConfigService } from '@nestjs/config'
import * as appleReceiptVerify from 'node-apple-receipt-verify'

import { UsersService } from '../users/users.service'

export interface SubscriptionInfo {
  userId: string
  productId: string | null
  status: 'active' | 'expired' | 'cancelled' | 'none'
  expiresAt?: Date
  createdAt?: Date
}

export interface SubscriptionStats {
  totalActive: number
  totalExpired: number
  totalCancelled: number
  revenueEstimate: number
}

const SUBSCRIPTION_PRICES: Record<string, number> = {
  'poke.monthly': 4.99,
  'poke.yearly': 39.99,
  'poke.lifetime': 99.99,
}

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionsService.name)
  private appleSharedSecret: string
  private isConfigured = false

  constructor(
    private readonly configService: ConfigService,
    private readonly users: UsersService
  ) {
    this.appleSharedSecret = this.configService.get<string>(
      'APPLE_SHARED_SECRET'
    )
  }

  async onModuleInit() {
    if (this.appleSharedSecret) {
      this.isConfigured = true
      this.logger.log('Apple receipt verification configured')
    } else {
      this.logger.warn('Apple shared secret not configured - subscriptions disabled')
    }
  }

  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
    const user = await this.users.findOne({ id: userId })

    if (!user) {
      return {
        userId,
        productId: null,
        status: 'none',
      }
    }

    return {
      userId,
      productId: user.activeSubscription,
      status: user.activeSubscription ? 'active' : 'none',
    }
  }

  async create(user: AuthUser, receipt: string): Promise<SubscriptionInfo> {
    if (!this.isConfigured) {
      this.logger.error('Cannot process subscription - Apple not configured')
      throw new Error('Subscription service not configured')
    }

    appleReceiptVerify.config({
      secret: this.appleSharedSecret,
      environment: ['production', 'sandbox'],
    })

    try {
      this.logger.log(`Processing subscription for user ${user.id}`)

      const products = await appleReceiptVerify.validate({ receipt })
      const uniqueTransactions = [
        ...new Set(products.map((product) => product.productId)),
      ]

      if (uniqueTransactions.length) {
        const productId = uniqueTransactions[0]

        await this.users.update({
          where: { id: user.id },
          data: { activeSubscription: productId },
        })

        this.logger.log(`Subscription ${productId} activated for user ${user.id}`)

        return {
          userId: user.id,
          productId,
          status: 'active',
          createdAt: new Date(),
        }
      }

      return {
        userId: user.id,
        productId: null,
        status: 'none',
      }
    } catch (e) {
      this.logger.error(`Failed to verify receipt for user ${user.id}: ${e.message}`)
      throw new Error(`Failed to verify Apple receipt: ${e}`)
    }
  }

  async delete(user: AuthUser): Promise<SubscriptionInfo> {
    try {
      this.logger.log(`Cancelling subscription for user ${user.id}`)

      await this.users.update({
        where: { id: user.id },
        data: { activeSubscription: null },
      })

      this.logger.log(`Subscription cancelled for user ${user.id}`)

      return {
        userId: user.id,
        productId: null,
        status: 'cancelled',
      }
    } catch (e) {
      this.logger.error(`Failed to cancel subscription for user ${user.id}: ${e.message}`)
      throw new Error(`Failed to cancel the subscription: ${e}`)
    }
  }

  async getStats(): Promise<SubscriptionStats> {
    const users = await this.users.findAll()

    const activeSubscriptions = users.filter((u) => u.activeSubscription)

    const revenueEstimate = activeSubscriptions.reduce((total, user) => {
      const price = SUBSCRIPTION_PRICES[user.activeSubscription] || 0
      return total + price
    }, 0)

    return {
      totalActive: activeSubscriptions.length,
      totalExpired: 0,
      totalCancelled: 0,
      revenueEstimate,
    }
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const info = await this.getSubscriptionInfo(userId)
    return info.status === 'active'
  }
}
