import { Module } from '@nestjs/common'
import { StripeService } from './stripe.service'
import { StripeController } from './stripe.controller'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [UsersModule],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
