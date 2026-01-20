import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { Prisma } from '@prisma/client'
import { UsersService, UserStats } from './users.service'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('onboard')
  onboard(@CurrentUser() user: AuthUser) {
    return this.usersService.onboard({ id: user.id, phone: user.phone })
  }

  @Get('me')
  getCurrentUser(@CurrentUser() user: AuthUser) {
    return this.usersService.findOneOrFail({ id: user.id })
  }

  @Get('me/stats')
  getMyStats(@CurrentUser() user: AuthUser): Promise<UserStats> {
    return this.usersService.getUserStats(user.id)
  }

  @Get('me/subscription')
  async getMySubscription(@CurrentUser() user: AuthUser) {
    const tier = await this.usersService.getSubscriptionTier(user.id)
    const hasActive = await this.usersService.hasActiveSubscription(user.id)
    return {
      tier,
      active: hasActive,
      features: this.getFeaturesByTier(tier),
    }
  }

  @Patch('me')
  updateCurrentUser(
    @CurrentUser() user: AuthUser,
    @Body() data: Prisma.UserUpdateInput
  ) {
    return this.usersService.update({ where: { id: user.id }, data })
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() data: Prisma.UserUpdateInput
  ) {
    if (user.id !== id) {
      throw new ForbiddenException('You can only update your own profile')
    }
    return this.usersService.update({ where: { id }, data })
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCurrentUser(@CurrentUser() user: AuthUser): Promise<void> {
    await this.usersService.remove({ id: user.id })
  }

  private getFeaturesByTier(tier: string): string[] {
    const features: Record<string, string[]> = {
      free: ['1 reminder', 'Basic notifications', 'Email support'],
      premium: [
        'Unlimited reminders',
        'Priority notifications',
        'Custom emojis',
        'Analytics dashboard',
        'Priority support',
      ],
      enterprise: [
        'Everything in Premium',
        'Team management',
        'API access',
        'Custom integrations',
        'Dedicated support',
      ],
    }
    return features[tier] || features.free
  }
}
