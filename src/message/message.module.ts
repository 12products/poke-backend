// Message module - encapsulates SMS messaging functionality
// Handles sending and receiving messages via Twilio
import { Module } from '@nestjs/common'

// Import service and controller for messages
import { MessageService } from './message.service'
import { MessageController } from './message.controller'
// Database module for storing message records
import { DatabaseModule } from '../database/database.module'
// Twilio module for SMS delivery
import { TwilioModule } from '../twilio/twilio.module'

// Module decorator configures the message module
@Module({
  // Import required modules for database and SMS
  imports: [DatabaseModule, TwilioModule],
  // Register the message controller for HTTP endpoints
  controllers: [MessageController],
  // Register MessageService for business logic
  providers: [MessageService],
  // Export MessageService for use by other modules (like RemindersModule)
  exports: [MessageService],
})
// Export the MessageModule class
export class MessageModule {}
