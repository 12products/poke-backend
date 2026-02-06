import { Controller, Get } from '@nestjs/common'

import { Public } from '../auth/public.decorator'
import { StatusService, SystemStatus } from './status.service'

@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Public()
  @Get()
  async getStatus(): Promise<SystemStatus> {
    return this.statusService.getSystemStatus()
  }
}
