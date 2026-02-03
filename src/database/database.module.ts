// Database module - provides database connectivity
// Wraps Prisma client in a NestJS module for dependency injection
import { Module } from '@nestjs/common'

// Import the database service that wraps Prisma
import { DatabaseService } from '../database/database.service'

// Module decorator configures the database module
@Module({
  // Register DatabaseService as a provider
  providers: [DatabaseService],
  // Export the service so other modules can use it
  exports: [DatabaseService],
})
// Export the DatabaseModule class
export class DatabaseModule {}
