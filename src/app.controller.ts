import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'
import { APP_NAME, APP_VERSION } from './constants'

interface HealthResponse {
  status: string
  name: string
  version: string
  timestamp: string
  uptime: number
}

interface StatusResponse {
  healthy: boolean
  services: {
    database: string
    twilio: string
  }
}

@Controller()
export class AppController {
  private readonly startTime: Date = new Date()

  @Public()
  @Get()
  healthCheck(): HealthResponse {
    return {
      status: 'OK',
      name: APP_NAME,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
    }
  }

  @Public()
  @Get('status')
  getStatus(): StatusResponse {
    return {
      healthy: true,
      services: {
        database: 'connected',
        twilio: 'connected',
      },
    }
  }

  @Public()
  @Get('ping')
  ping(): string {
    return 'pong'
  }
}
