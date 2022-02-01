import { Injectable } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'
import { ConfigService } from '@nestjs/config'
import * as appleReceiptVerify from 'node-apple-receipt-verify'

import { UsersService } from '../users/users.service'

@Injectable()
export class SubscriptionsService {
  private appleSharedSecret: string

  constructor(
    private readonly configService: ConfigService,
    private readonly users: UsersService
  ) {
    this.appleSharedSecret = this.configService.get<string>(
      'APPLE_SHARED_SECRET'
    )
  }

  async create(user: AuthUser, receipt: string) {
    appleReceiptVerify.config({
      secret: this.appleSharedSecret,
      environment: ['sandbox'],
    })

    try {
      const products = await appleReceiptVerify.validate({ receipt })
      const uniqueTransactions = [
        ...new Set(products.map((product) => product.originalTransactionId)),
      ]

      if (uniqueTransactions.length) {
        await this.users.update({
          where: { id: user.id },
          data: { activeSubscription: uniqueTransactions[0] },
        })
      }
    } catch (e) {
      throw new Error(`Failed to verify Apple receipt: ${e}`)
    }

    return 'ok'
  }

  async delete(user: AuthUser) {
    try {
      await this.users.update({
        where: { id: user.id },
        data: { activeSubscription: null },
      })
    } catch (e) {
      throw new Error(`Failed to cancel the subscription: ${e}`)
    }

    return 'ok'
  }
}
