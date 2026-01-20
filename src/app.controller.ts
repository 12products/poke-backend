import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

interface HealthCheckResponse {
  status: string
  timestamp: string
  uptime: number
  version: string
  environment: string
}

interface SystemStats {
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: NodeJS.CpuUsage
  platform: string
  nodeVersion: string
}

@Controller()
export class AppController {
  private readonly startTime: number

  constructor() {
    this.startTime = Date.now()
  }

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
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '0.0.1',
      environment: process.env.NODE_ENV || 'development',
    }
  }

  @Public()
  @Get('stats')
  getSystemStats(): SystemStats {
    return {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    }
  }

  @Public()
  @Get('ping')
  ping(): { pong: boolean; time: number } {
    return {
      pong: true,
      time: Date.now(),
    }
  }
}
