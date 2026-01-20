import { Get, Controller, Logger } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'
import { DatabaseService, DatabaseStats } from './database/database.service'
import { TwilioService } from './twilio/twilio.service'

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  version: string
  uptime: number
  services: {
    database: boolean
    twilio: boolean
  }
}

interface SystemInfo {
  nodeVersion: string
  platform: string
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
  }
  uptime: number
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name)
  private readonly startTime = Date.now()

  constructor(
    private readonly db: DatabaseService,
    private readonly twilio: TwilioService
  ) {}

  @Public()
  @Get()
  healthCheck(): string {
    return 'OK'
  }

  @Public()
  @Get('health')
  async detailedHealthCheck(): Promise<HealthCheckResponse> {
    const dbHealthy = await this.db.healthCheck()
    const twilioReady = this.twilio.isReady()

    const status = dbHealthy && twilioReady ? 'ok' : dbHealthy ? 'degraded' : 'error'

    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.1',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: {
        database: dbHealthy,
        twilio: twilioReady,
      },
    }
  }

  @Public()
  @Get('ping')
  ping(): { pong: boolean; timestamp: number } {
    return {
      pong: true,
      timestamp: Date.now(),
    }
  }

  @Public()
  @Get('stats')
  async getStats(): Promise<DatabaseStats> {
    return this.db.getStats()
  }

  @Public()
  @Get('info')
  getSystemInfo(): SystemInfo {
    const memoryUsage = process.memoryUsage()

    return {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    }
  }

  @Public()
  @Get('ready')
  async readinessCheck(): Promise<{ ready: boolean }> {
    const dbHealthy = await this.db.healthCheck()
    return { ready: dbHealthy }
  }

  @Public()
  @Get('live')
  livenessCheck(): { alive: boolean } {
    return { alive: true }
  }
}
