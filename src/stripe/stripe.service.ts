import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name)
  private stripeClient: Stripe
  private stripePublicKey: string
  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY')
    this.stripePublicKey = this.configService.get<string>('STRIPE_PUBLIC_KEY')
    this.stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: '2020-08-27',
    })
  }

  async createCustomer() {
    const customer = await this.stripeClient.customers.create()
    return customer
  }

  async createPaymentSheet() {
    this.logger.log('Creating payment sheet')
    const customer = await this.createCustomer()
    const ephemeralkey = await this.stripeClient.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2020-08-27' }
    )
    const paymentIntent = await this.stripeClient.paymentIntents.create({
      amount: 10,
      currency: 'usd',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    })
    return {
      paymentIntent: paymentIntent.client_secret,
      ephemeralkey: ephemeralkey.secret,
      customer: customer.id,
      publishableKey: this.stripePublicKey,
    }
  }
}
