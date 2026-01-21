import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'
import { ConfigService } from '@nestjs/config'
import * as appleReceiptVerify from 'node-apple-receipt-verify'

import { UsersService } from '../users/users.service'

export interface SubscriptionInfo {
  active: boolean
  productId: string | null
  expiresAt: Date | null
  platform: 'apple' | 'google' | null
}

export interface SubscriptionStats {
  totalActive: number
  newThisMonth: number
  cancelledThisMonth: number
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name)
  private appleSharedSecret: string

  constructor(
    private readonly configService: ConfigService,
    private readonly users: UsersService
  ) {
    this.appleSharedSecret = this.configService.get<string>(
      'APPLE_SHARED_SECRET'
    )
  }

  async create(user: AuthUser, receipt: string): Promise<SubscriptionInfo> {
    if (!receipt || receipt.trim() === '') {
      throw new BadRequestException('Receipt is required')
    }

    appleReceiptVerify.config({
      secret: this.appleSharedSecret,
      environment: ['production', 'sandbox'],
    })

    try {
      const products = await appleReceiptVerify.validate({ receipt })
      const uniqueTransactions = [
        ...new Set(products.map((product) => product.productId)),
      ]

      if (uniqueTransactions.length) {
        await this.users.update({
          where: { id: user.id },
          data: { activeSubscription: uniqueTransactions[0] },
        })

        this.logger.log(`Subscription created for user ${user.id}: ${uniqueTransactions[0]}`)

        return {
          active: true,
          productId: uniqueTransactions[0],
          expiresAt: null, // Would need to extract from receipt
          platform: 'apple',
        }
      }
    } catch (e) {
      this.logger.error(`Failed to verify Apple receipt for user ${user.id}`, e)
      throw new BadRequestException(`Failed to verify Apple receipt: ${e}`)
    }

    return {
      active: false,
      productId: null,
      expiresAt: null,
      platform: null,
    }
  }

  async delete(user: AuthUser): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = await this.users.findOne({ id: user.id })
      if (!currentUser?.activeSubscription) {
        return { success: false, message: 'No active subscription found' }
      }

      await this.users.update({
        where: { id: user.id },
        data: { activeSubscription: null },
      })

      this.logger.log(`Subscription cancelled for user ${user.id}`)

      return { success: true, message: 'Subscription cancelled successfully' }
    } catch (e) {
      this.logger.error(`Failed to cancel subscription for user ${user.id}`, e)
      throw new BadRequestException(`Failed to cancel the subscription: ${e}`)
    }
  }

  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
    const user = await this.users.findOne({ id: userId })

    return {
      active: !!user?.activeSubscription,
      productId: user?.activeSubscription || null,
      expiresAt: null,
      platform: user?.activeSubscription ? 'apple' : null,
    }
  }

  async isSubscribed(userId: string): Promise<boolean> {
    const user = await this.users.findOne({ id: userId })
    return !!user?.activeSubscription
  }

  async getActiveSubscriptionCount(): Promise<number> {
    // This would need a more efficient query in production
    const users = await this.users.findAll()
    return users.filter((u) => u.activeSubscription).length
  }

  async restoreSubscription(
    user: AuthUser,
    receipt: string
  ): Promise<SubscriptionInfo> {
    this.logger.log(`Attempting to restore subscription for user ${user.id}`)
    return this.create(user, receipt)
  }
}
