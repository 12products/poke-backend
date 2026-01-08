import { Controller, Get, Param } from '@nestjs/common'
import { PlansService } from './plans.service'
import { Plan } from './plans.constants'

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  findAll(): Plan[] {
    return this.plansService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string): Plan | undefined {
    return this.plansService.findOne(id)
  }
}
