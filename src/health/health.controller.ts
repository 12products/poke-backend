import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common'
import { HealthService, HealthStatus } from './health.service'
import { Public } from '../auth/public.decorator'

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getHealth(): Promise<HealthStatus> {
    const health = await this.healthService.getHealth()

    if (health.status === 'unhealthy') {
      throw new ServiceUnavailableException(health)
    }

    return health
  }

  @Public()
  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string } {
    return { status: 'alive' }
  }

  @Public()
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness(): Promise<{ status: string; ready: boolean }> {
    const isHealthy = await this.healthService.isHealthy()

    if (!isHealthy) {
      throw new ServiceUnavailableException('Service not ready')
    }

    return {
      status: 'ready',
      ready: true,
    }
  }

  @Public()
  @Get('uptime')
  @HttpCode(HttpStatus.OK)
  getUptime(): { uptime: number; formatted: string } {
    const uptime = this.healthService.getUptime()
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = uptime % 60

    return {
      uptime,
      formatted: `${hours}h ${minutes}m ${seconds}s`,
    }
  }
}
