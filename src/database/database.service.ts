// Database service - where all the data goes to sleep
// Think of it as a digital filing cabinet, but cooler
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  // Wake up, database! Time to work!
  async onModuleInit() {
    await this.$connect() // knock knock, anybody home?
  }

  // Graceful shutdown - we're polite like that
  async enableShutdownHooks(app: INestApplication) {
    // When it's time to go, say goodbye properly
    this.$on('beforeExit', async () => {
      await app.close() // peace out!
    })
  }
}
