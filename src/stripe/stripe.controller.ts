import { Controller, Post } from '@nestjs/common'
import { StripeService } from './stripe.service'

@Controller('subscriptions')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('/paymentIntent')
  createPaymentIntent() {
    return this.stripeService.createPaymentIntent()
  }
  @Post('/customers')
  createCustomer() {
    return this.stripeService.createCustomer()
  }
}
