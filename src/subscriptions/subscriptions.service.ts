import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'
import { ConfigService } from '@nestjs/config'
import * as appleReceiptVerify from 'node-apple-receipt-verify'

import { UsersService } from '../users/users.service'
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '../constants'
import { generateTrackingId } from '../utils'

export interface SubscriptionInfo {
  tier: SubscriptionTier
  productId: string | null
  isActive: boolean
  expiresAt: Date | null
  features: string[]
}

export interface VerificationResult {
  success: boolean
  productId?: string
  error?: string
}

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  [SUBSCRIPTION_TIERS.FREE]: [
    '1 reminder',
    'Basic SMS notifications',
    'Email support',
  ],
  [SUBSCRIPTION_TIERS.PREMIUM]: [
    'Up to 50 reminders',
    'Priority SMS notifications',
    'Custom emojis',
    'Analytics dashboard',
    'Priority support',
    'Streak tracking',
  ],
  [SUBSCRIPTION_TIERS.ENTERPRISE]: [
    'Unlimited reminders',
    'Team management',
    'API access',
    'Custom integrations',
    'Dedicated account manager',
    'SLA guarantees',
    'Custom branding',
  ],
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name)
  private readonly appleSharedSecret: string

  constructor(
    private readonly configService: ConfigService,
    private readonly users: UsersService
  ) {
    this.appleSharedSecret = this.configService.get<string>('APPLE_SHARED_SECRET') || ''
  }

  async create(user: AuthUser, receipt: string): Promise<VerificationResult> {
    const trackingId = generateTrackingId()
    this.logger.log(`[${trackingId}] Verifying Apple receipt for user: ${user.id}`)

    if (!receipt || receipt.trim() === '') {
      throw new BadRequestException('Receipt is required')
    }

    appleReceiptVerify.config({
      secret: this.appleSharedSecret,
      environment: ['production', 'sandbox'],
    })

    try {
      const products = await appleReceiptVerify.validate({ receipt })
      this.logger.log(`[${trackingId}] Receipt validated, found ${products.length} products`)

      const uniqueTransactions = [
        ...new Set(products.map((product) => product.productId)),
      ]

      if (uniqueTransactions.length === 0) {
        this.logger.warn(`[${trackingId}] No valid transactions found in receipt`)
        return {
          success: false,
          error: 'No valid subscriptions found in receipt',
        }
      }

      const productId = uniqueTransactions[0]
      await this.users.update({
        where: { id: user.id },
        data: { activeSubscription: productId },
      })

      this.logger.log(
        `[${trackingId}] Successfully activated subscription: ${productId} for user: ${user.id}`
      )

      return {
        success: true,
        productId,
      }
    } catch (e) {
      this.logger.error(`[${trackingId}] Failed to verify Apple receipt: ${e.message}`)
      throw new BadRequestException(`Failed to verify Apple receipt: ${e.message}`)
    }
  }

  async delete(user: AuthUser): Promise<{ success: boolean }> {
    const trackingId = generateTrackingId()
    this.logger.log(`[${trackingId}] Cancelling subscription for user: ${user.id}`)

    try {
      await this.users.update({
        where: { id: user.id },
        data: { activeSubscription: null },
      })

      this.logger.log(`[${trackingId}] Successfully cancelled subscription for user: ${user.id}`)
      return { success: true }
    } catch (e) {
      this.logger.error(`[${trackingId}] Failed to cancel subscription: ${e.message}`)
      throw new BadRequestException(`Failed to cancel the subscription: ${e.message}`)
    }
  }

  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
    const user = await this.users.findOne({ id: userId })

    if (!user || !user.activeSubscription) {
      return {
        tier: SUBSCRIPTION_TIERS.FREE,
        productId: null,
        isActive: false,
        expiresAt: null,
        features: TIER_FEATURES[SUBSCRIPTION_TIERS.FREE],
      }
    }

    const tier = this.mapProductIdToTier(user.activeSubscription)

    return {
      tier,
      productId: user.activeSubscription,
      isActive: true,
      expiresAt: null,
      features: TIER_FEATURES[tier],
    }
  }

  async verifySubscriptionStatus(userId: string): Promise<boolean> {
    const info = await this.getSubscriptionInfo(userId)
    return info.isActive
  }

  async upgradeTier(userId: string, newTier: SubscriptionTier): Promise<SubscriptionInfo> {
    const trackingId = generateTrackingId()
    this.logger.log(`[${trackingId}] Upgrading user ${userId} to tier: ${newTier}`)

    await this.users.update({
      where: { id: userId },
      data: { activeSubscription: newTier },
    })

    return this.getSubscriptionInfo(userId)
  }

  getAvailableTiers(): Array<{ tier: SubscriptionTier; features: string[] }> {
    return Object.entries(TIER_FEATURES).map(([tier, features]) => ({
      tier: tier as SubscriptionTier,
      features,
    }))
  }

  private mapProductIdToTier(productId: string): SubscriptionTier {
    if (productId.includes('enterprise')) {
      return SUBSCRIPTION_TIERS.ENTERPRISE
    }
    if (productId.includes('premium') || productId.includes('pro')) {
      return SUBSCRIPTION_TIERS.PREMIUM
    }
    return SUBSCRIPTION_TIERS.FREE
  }
}
