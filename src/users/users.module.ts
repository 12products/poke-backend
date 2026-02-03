// Users module - encapsulates user management functionality
// Provides user CRUD operations and onboarding
import { Module } from '@nestjs/common'

// Import service and controller for users
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
// Database module for Prisma access
import { DatabaseModule } from '../database/database.module'

// Module decorator configures the users module
@Module({
  // Import DatabaseModule for database operations
  imports: [DatabaseModule],
  // Register the users controller for handling HTTP requests
  controllers: [UsersController],
  // Register UsersService for business logic
  providers: [UsersService],
  // Export UsersService so other modules can access user operations
  exports: [UsersService],
})
// Export the UsersModule class
export class UsersModule {}
