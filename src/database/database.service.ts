import { INestApplication, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close()
    })
  }

  async healthCheck(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = Date.now()
    try {
      await this.$queryRaw`SELECT 1`
      return {
        connected: true,
        latencyMs: Date.now() - start,
      }
    } catch {
      return {
        connected: false,
        latencyMs: Date.now() - start,
      }
    }
  }
}
