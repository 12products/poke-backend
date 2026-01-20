import {
  INestApplication,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

export interface DatabaseStats {
  userCount: number
  reminderCount: number
  messageCount: number
  activeMessageCount: number
}

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseService.name)

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    })
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...')

    this.$on('query' as never, (e: any) => {
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(`Query: ${e.query}`)
        this.logger.debug(`Duration: ${e.duration}ms`)
      }
    })

    this.$on('error' as never, (e: any) => {
      this.logger.error(`Database error: ${e.message}`)
    })

    try {
      await this.$connect()
      this.logger.log('Successfully connected to database')
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${error.message}`)
      throw error
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...')
    await this.$disconnect()
    this.logger.log('Disconnected from database')
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit' as never, async () => {
      this.logger.log('Database shutdown hook triggered')
      await app.close()
    })
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }

  async getStats(): Promise<DatabaseStats> {
    const [userCount, reminderCount, messageCount, activeMessageCount] =
      await Promise.all([
        this.user.count(),
        this.reminder.count(),
        this.message.count(),
        this.message.count({ where: { active: true } }),
      ])

    return {
      userCount,
      reminderCount,
      messageCount,
      activeMessageCount,
    }
  }

  async cleanupOldMessages(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await this.message.deleteMany({
      where: {
        active: false,
        updatedAt: { lt: cutoffDate },
      },
    })

    this.logger.log(`Cleaned up ${result.count} old messages`)
    return result.count
  }
}
