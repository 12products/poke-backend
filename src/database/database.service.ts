// Database Service
// Wrapper around Prisma Client for database operations
// Handles connection lifecycle and shutdown hooks
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

// This service extends PrismaClient, so it inherits all Prisma methods
// It also implements OnModuleInit for lifecycle management
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  // Called automatically when the module is initialized
  // This ensures the database connection is ready before handling requests
  async onModuleInit() {
    // Connect to the database
    // Prisma will use the DATABASE_URL from environment
    await this.$connect()
  }

  // Set up hooks for graceful shutdown
  // This ensures database connections are closed properly
  async enableShutdownHooks(app: INestApplication) {
    // Listen for the beforeExit event from Prisma
    this.$on('beforeExit', async () => {
      // Close the NestJS application cleanly
      await app.close()
    })
  }
}

// Note: This service is used throughout the app as 'db'
// Example usage: this.db.user.findMany(), this.db.reminder.create(), etc.
