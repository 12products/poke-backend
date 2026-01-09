import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'
import { APP_VERSION } from './constants'

interface HealthCheckResponse {
  status: string
  version: string
  timestamp: string
  uptime: number
}

@Controller()
export class AppController {
  private readonly startTime = Date.now()

  @Public()
  @Get()
  healthCheck(): HealthCheckResponse {
    return {
      status: 'OK',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    }
  }

  @Public()
  @Get('ping')
  ping(): string {
    return 'pong'
  }
}
