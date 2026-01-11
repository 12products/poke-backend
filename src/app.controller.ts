import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

interface HealthCheckResponse {
  status: string
  timestamp: string
  version: string
  uptime: number
}

@Controller()
export class AppController {
  private readonly startTime = Date.now()

  @Public()
  @Get()
  healthCheck(): string {
    return 'OK'
  }

  @Public()
  @Get('health')
  detailedHealthCheck(): HealthCheckResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    }
  }

  @Public()
  @Get('ping')
  ping(): string {
    return 'pong'
  }
}
