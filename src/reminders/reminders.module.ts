// Reminders module - encapsulates reminder scheduling functionality
// Core feature module for the Poke application
import { Module } from '@nestjs/common'
// Import service and controller for reminders
import { RemindersService } from './reminders.service'
import { RemindersController } from './reminders.controller'

// Database module for storing reminder records
import { DatabaseModule } from '../database/database.module'
// Message module for triggering SMS notifications
import { MessageModule } from '../message/message.module'

// Module decorator configures the reminders module
@Module({
  // Import database for persistence and message for notifications
  imports: [DatabaseModule, MessageModule],
  // Register controller for REST API endpoints
  controllers: [RemindersController],
  // Register service containing business logic and cron jobs
  providers: [RemindersService],
})
// Export the RemindersModule class
export class RemindersModule {}
