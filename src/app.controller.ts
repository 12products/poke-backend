import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

interface HealthCheckResponse {
  status: string
  timestamp: string
  uptime: number
  version: string
}

@Controller()
export class AppController {
  @Public()
  @Get()
  root(): string {
    return 'Poke API is running'
  }

  @Public()
  @Get('health')
  healthCheck(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.0.1',
    }
  }
}
