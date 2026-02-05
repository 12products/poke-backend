// Database: where your data lives, laughs, and occasionally gets corrupted 🗄️
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

// "SELECT * FROM jokes WHERE funny = true" - Returns 0 rows for this file 😅
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Connecting to database... Please hold, your data is important to us! ☎️
    await this.$connect()
  }

  async enableShutdownHooks(app: INestApplication) {
    // Exit strategy: Better than my retirement plan! 🚪
    this.$on('beforeExit', async () => {
      await app.close()
    })
  }
}
