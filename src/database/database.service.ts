import {
  INestApplication,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common'
import { PrismaClient, Prisma } from '@prisma/client'

export interface DatabaseHealthCheck {
  connected: boolean
  latencyMs: number
  timestamp: string
}

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseService.name)
  private isConnected = false

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    })

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: Prisma.QueryEvent) => {
        if (e.duration > 100) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`)
        }
      })
    }
  }

  async onModuleInit() {
    try {
      await this.$connect()
      this.isConnected = true
      this.logger.log('Database connection established')
    } catch (error) {
      this.logger.error('Failed to connect to database', error)
      throw error
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.isConnected = false
    this.logger.log('Database connection closed')
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close()
    })
  }

  async healthCheck(): Promise<DatabaseHealthCheck> {
    const startTime = Date.now()
    try {
      await this.$queryRaw`SELECT 1`
      return {
        connected: true,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        connected: false,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }

  async executeTransaction<T>(
    fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect'>) => Promise<T>
  ): Promise<T> {
    return this.$transaction(fn)
  }

  async clearDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear database in production')
    }

    this.logger.warn('Clearing all database tables')

    const tablenames = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await this.$executeRawUnsafe(
            `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
          )
        } catch (error) {
          this.logger.error(`Failed to truncate ${tablename}`, error)
        }
      }
    }
  }
}
