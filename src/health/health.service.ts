import { Injectable, Logger } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  checks: {
    database: ComponentHealth
    memory: ComponentHealth
    disk?: ComponentHealth
  }
}

export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  message?: string
  details?: Record<string, unknown>
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name)
  private readonly startTime = Date.now()

  constructor(private readonly db: DatabaseService) {}

  async getHealth(): Promise<HealthStatus> {
    const [databaseHealth, memoryHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
    ])

    const allChecks = [databaseHealth, memoryHealth]
    const hasUnhealthy = allChecks.some((c) => c.status === 'down')
    const hasDegraded = allChecks.some((c) => c.status === 'degraded')

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (hasUnhealthy) {
      overallStatus = 'unhealthy'
    } else if (hasDegraded) {
      overallStatus = 'degraded'
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '0.0.1',
      checks: {
        database: databaseHealth,
        memory: memoryHealth,
      },
    }
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    try {
      const result = await this.db.healthCheck()
      return {
        status: result.connected ? 'up' : 'down',
        responseTime: result.latencyMs,
        message: result.connected
          ? 'Database connection healthy'
          : 'Database connection failed',
      }
    } catch (error) {
      this.logger.error('Database health check failed', error)
      return {
        status: 'down',
        message: 'Database health check failed',
      }
    }
  }

  private async checkMemory(): Promise<ComponentHealth> {
    const usage = process.memoryUsage()
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024)
    const usagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100)

    let status: 'up' | 'down' | 'degraded' = 'up'
    let message = 'Memory usage normal'

    if (usagePercent > 90) {
      status = 'degraded'
      message = 'Memory usage critical'
    } else if (usagePercent > 75) {
      status = 'degraded'
      message = 'Memory usage elevated'
    }

    return {
      status,
      message,
      details: {
        heapUsedMB,
        heapTotalMB,
        usagePercent,
        rss: Math.round(usage.rss / 1024 / 1024),
      },
    }
  }

  async isHealthy(): Promise<boolean> {
    const health = await this.getHealth()
    return health.status === 'healthy'
  }

  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000)
  }
}
