// Message controller - handles HTTP requests for messaging
// Exposes endpoints for sending and receiving SMS messages
import { Controller, Header, Post, Req } from '@nestjs/common'

// Public decorator for unauthenticated routes
import { Public } from 'src/auth/public.decorator'
import { MessageService } from './message.service'

// Controller for /message routes
@Controller('message')
export class MessageController {
  // Inject the message service for business logic
  constructor(private readonly messageService: MessageService) {}

  // POST /message - Send a message for a reminder
  // Requires authentication
  @Post()
  sendMessage(reminderId: string) {
    // Delegate to service to send the actual message
    return this.messageService.sendMessage(reminderId)
  }

  // POST /message/sms - Twilio webhook endpoint
  // This is called when a user replies to an SMS
  // Marked as public since Twilio can't authenticate
  @Public()
  @Post('sms')
  // Return XML for Twilio's TwiML response format
  @Header('Content-Type', 'text/xml')
  receiveMessage(@Req() req) {
    // Process the incoming SMS message
    return this.messageService.receiveMessage(req)
  }
}
