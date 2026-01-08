import { Injectable } from '@nestjs/common'
import { Plan, MOCK_PLANS } from './plans.constants'

@Injectable()
export class PlansService {
  findAll(): Plan[] {
    return MOCK_PLANS
  }

  findOne(id: string): Plan | undefined {
    return MOCK_PLANS.find((plan) => plan.id === id)
  }
}
