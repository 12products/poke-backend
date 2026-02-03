// Message Controller
// Handles HTTP endpoints for SMS message operations
// The /sms endpoint is the Twilio webhook for incoming texts
import { Controller, Header, Post, Req } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'
import { MessageService } from './message.service'

// Routes prefixed with /v1/message
@Controller('message')
export class MessageController {
  // Inject the message service
  constructor(private readonly messageService: MessageService) {}

  // POST /v1/message
  // Manually trigger sending a message for a reminder
  // This is probably used for testing/admin purposes
  @Post()
  sendMessage(reminderId: string) {
    // Delegate to the service to actually send the SMS
    return this.messageService.sendMessage(reminderId)
  }

  // POST /v1/message/sms
  // Twilio webhook endpoint for incoming SMS messages
  // This is called by Twilio when a user texts our number
  @Public() // No auth required - Twilio can't send our JWT
  @Post('sms')
  @Header('Content-Type', 'text/xml') // Twilio expects TwiML (XML) response
  receiveMessage(@Req() req) {
    // Process the incoming message and generate a response
    // The service will check if the user responded with their emoji
    return this.messageService.receiveMessage(req)
  }
}
