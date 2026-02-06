import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { DatabaseService } from '../database/database.service'

export interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latencyMs?: number
  message?: string
}

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'down'
  version: string
  uptimeSeconds: number
  timestamp: string
  services: ServiceStatus[]
  memory: {
    heapUsedMB: number
    heapTotalMB: number
    rssMB: number
  }
}

@Injectable()
export class StatusService {
  private readonly startTime: number

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService
  ) {
    this.startTime = Date.now()
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const services = await Promise.all([
      this.checkDatabase(),
      this.checkTwilioConfig(),
      this.checkSupabaseConfig(),
    ])

    const overallStatus = this.determineOverallStatus(services)
    const memoryUsage = process.memoryUsage()

    return {
      status: overallStatus,
      version: process.env.npm_package_version || '1.0.0',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      services,
      memory: {
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
      },
    }
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now()
    try {
      await this.databaseService.$queryRaw`SELECT 1`
      return {
        name: 'database',
        status: 'healthy',
        latencyMs: Date.now() - start,
      }
    } catch (error) {
      return {
        name: 'database',
        status: 'down',
        latencyMs: Date.now() - start,
        message: 'Unable to reach database',
      }
    }
  }

  private checkTwilioConfig(): ServiceStatus {
    const accountId = this.configService.get<string>('TWILIO_ACCOUNT_ID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    const phone = this.configService.get<string>('TWILIO_PHONE')

    if (accountId && authToken && phone) {
      return {
        name: 'twilio',
        status: 'healthy',
        message: 'Configuration present',
      }
    }

    return {
      name: 'twilio',
      status: 'degraded',
      message: 'Missing configuration variables',
    }
  }

  private checkSupabaseConfig(): ServiceStatus {
    const url = this.configService.get<string>('SUPABASE_URL')
    const key = this.configService.get<string>('SUPABASE_KEY')
    const jwtSecret = this.configService.get<string>('SUPABASE_JWT_SECRET')

    if (url && key && jwtSecret) {
      return {
        name: 'supabase',
        status: 'healthy',
        message: 'Configuration present',
      }
    }

    return {
      name: 'supabase',
      status: 'degraded',
      message: 'Missing configuration variables',
    }
  }

  private determineOverallStatus(
    services: ServiceStatus[]
  ): 'healthy' | 'degraded' | 'down' {
    if (services.some((s) => s.status === 'down')) {
      return 'down'
    }
    if (services.some((s) => s.status === 'degraded')) {
      return 'degraded'
    }
    return 'healthy'
  }
}
