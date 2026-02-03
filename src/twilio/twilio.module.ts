// Twilio module - encapsulates SMS communication functionality
// Provides Twilio client wrapper for sending and receiving SMS
import { Module } from '@nestjs/common'
// Import controller and service for Twilio operations
import { TwilioController } from './twilio.controller'
import { TwilioService } from './twilio.service'

// Module decorator configures the Twilio module
@Module({
  // Register the Twilio controller (currently empty/placeholder)
  controllers: [TwilioController],
  // Register TwilioService as a provider
  providers: [TwilioService],
  // Export TwilioService so MessageModule can use it
  exports: [TwilioService],
})
// Export the TwilioModule class
export class TwilioModule {}
