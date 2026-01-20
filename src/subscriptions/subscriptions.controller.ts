import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { SubscriptionsService, SubscriptionInfo, VerificationResult } from './subscriptions.service'
import { AuthUser } from '@supabase/supabase-js'

import { CurrentUser } from '../auth/current-user.decorator'
import { Public } from '../auth/public.decorator'
import { SubscriptionTier } from '../constants'

interface CreateSubscriptionDto {
  receipt: string
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  getSubscription(@CurrentUser() user: AuthUser): Promise<SubscriptionInfo> {
    return this.subscriptionsService.getSubscriptionInfo(user.id)
  }

  @Get('status')
  async getStatus(@CurrentUser() user: AuthUser): Promise<{ active: boolean }> {
    const active = await this.subscriptionsService.verifySubscriptionStatus(user.id)
    return { active }
  }

  @Public()
  @Get('tiers')
  getTiers(): Array<{ tier: SubscriptionTier; features: string[] }> {
    return this.subscriptionsService.getAvailableTiers()
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  create(
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() user: AuthUser
  ): Promise<VerificationResult> {
    return this.subscriptionsService.create(user, dto.receipt)
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@CurrentUser() user: AuthUser): Promise<{ valid: boolean }> {
    const valid = await this.subscriptionsService.verifySubscriptionStatus(user.id)
    return { valid }
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  delete(@CurrentUser() user: AuthUser): Promise<{ success: boolean }> {
    return this.subscriptionsService.delete(user)
  }
}
