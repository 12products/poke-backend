import {
  Controller,
  Post,
  Delete,
  Body,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  SubscriptionsService,
  SubscriptionInfo,
} from './subscriptions.service'
import { AuthUser } from '@supabase/supabase-js'

import { CurrentUser } from '../auth/current-user.decorator'
import { Public } from '../auth/public.decorator'

interface CreateSubscriptionDto {
  receipt: string
  platform?: 'apple' | 'google'
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  getSubscription(@CurrentUser() user: AuthUser): Promise<SubscriptionInfo> {
    return this.subscriptionsService.getSubscriptionInfo(user.id)
  }

  @Get('status')
  async getStatus(
    @CurrentUser() user: AuthUser
  ): Promise<{ active: boolean }> {
    const isActive = await this.subscriptionsService.isSubscribed(user.id)
    return { active: isActive }
  }

  @Post()
  create(
    @Body() body: CreateSubscriptionDto,
    @CurrentUser() user: AuthUser
  ): Promise<SubscriptionInfo> {
    return this.subscriptionsService.create(user, body.receipt)
  }

  @Post('restore')
  restore(
    @Body() body: CreateSubscriptionDto,
    @CurrentUser() user: AuthUser
  ): Promise<SubscriptionInfo> {
    return this.subscriptionsService.restoreSubscription(user, body.receipt)
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  delete(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.delete(user)
  }

  @Public()
  @Get('count')
  async getActiveCount(): Promise<{ count: number }> {
    const count = await this.subscriptionsService.getActiveSubscriptionCount()
    return { count }
  }
}
