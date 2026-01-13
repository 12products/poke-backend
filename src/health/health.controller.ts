import { Controller, Get } from '@nestjs/common'
import { Public } from '../auth/public.decorator'

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  checks: HealthCheckDetail[]
}

export interface HealthCheckDetail {
  name: string
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  message?: string
}

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now()

  @Public()
  @Get()
  async check(): Promise<HealthCheckResponse> {
    const checks = await this.runHealthChecks()
    const overallStatus = this.determineOverallStatus(checks)

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    }
  }

  @Public()
  @Get('ping')
  ping(): { pong: boolean } {
    return { pong: true }
  }

  @Public()
  @Get('ready')
  async ready(): Promise<{ ready: boolean }> {
    // Check if service is ready to accept traffic
    return { ready: true }
  }

  @Public()
  @Get('live')
  live(): { alive: boolean } {
    // Basic liveness check
    return { alive: true }
  }

  private async runHealthChecks(): Promise<HealthCheckDetail[]> {
    const checks: HealthCheckDetail[] = []

    // Memory check
    const memUsage = process.memoryUsage()
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const memoryPercent = (heapUsedMB / heapTotalMB) * 100

    checks.push({
      name: 'memory',
      status: memoryPercent > 90 ? 'fail' : memoryPercent > 70 ? 'warn' : 'pass',
      message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${memoryPercent.toFixed(1)}%)`,
    })

    // Event loop check
    const eventLoopDelay = await this.measureEventLoopDelay()
    checks.push({
      name: 'event_loop',
      status: eventLoopDelay > 100 ? 'fail' : eventLoopDelay > 50 ? 'warn' : 'pass',
      responseTime: eventLoopDelay,
      message: `Event loop delay: ${eventLoopDelay}ms`,
    })

    return checks
  }

  private determineOverallStatus(checks: HealthCheckDetail[]): 'ok' | 'degraded' | 'unhealthy' {
    const hasFailure = checks.some((c) => c.status === 'fail')
    const hasWarning = checks.some((c) => c.status === 'warn')

    if (hasFailure) return 'unhealthy'
    if (hasWarning) return 'degraded'
    return 'ok'
  }

  private measureEventLoopDelay(): Promise<number> {
    return new Promise((resolve) => {
      const start = Date.now()
      setImmediate(() => {
        resolve(Date.now() - start)
      })
    })
  }
}
