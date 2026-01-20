import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'
import { pickRandom } from './utils'
import { emojis } from './constants'

interface HealthResponse {
  status: string
  timestamp: string
  uptime: number
  version: string
  mascot: string
}

@Controller()
export class AppController {
  private readonly startTime = Date.now()

  @Public()
  @Get()
  healthCheck(): HealthResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      mascot: pickRandom(emojis),
    }
  }
}
