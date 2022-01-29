import { Controller, Post } from '@nestjs/common'
import { StripeService } from './stripe.service'

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('/payment-sheet')
  createPaymentSheet() {
    return this.stripeService.createPaymentSheet()
  }
  @Post('/customers')
  createCustomer() {
    return this.stripeService.createCustomer()
  }
}
