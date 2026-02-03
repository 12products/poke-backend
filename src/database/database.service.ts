// Database service - wraps Prisma Client for dependency injection
// This service manages the database connection lifecycle
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

// Injectable service that extends PrismaClient
// Implements OnModuleInit for connection handling
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  // Called when the module is initialized
  // Establishes connection to the database
  async onModuleInit() {
    // Connect to the database using Prisma
    await this.$connect()
  }

  // Enable graceful shutdown hooks
  // Ensures database connection is properly closed when app terminates
  async enableShutdownHooks(app: INestApplication) {
    // Listen for Prisma's beforeExit event
    this.$on('beforeExit', async () => {
      // Close the NestJS application gracefully
      await app.close()
    })
  }
}
