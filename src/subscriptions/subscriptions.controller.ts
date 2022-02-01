import { Controller, Post, Delete, Body } from '@nestjs/common'
import { SubscriptionsService } from './subscriptions.service'
import { AuthUser } from '@supabase/supabase-js'

import { CurrentUser } from '../auth/current-user.decorator'

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body() subscriptionReceipt: string, @CurrentUser() user: AuthUser) {
    return this.subscriptionsService.create(user, subscriptionReceipt)
  }

  @Delete()
  delete(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.delete(user)
  }
}
