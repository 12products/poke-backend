// Twilio controller - placeholder for future Twilio endpoints
// Currently empty but could be extended for Twilio webhook management
import { Controller } from '@nestjs/common'
import { TwilioService } from './twilio.service'

// Controller for /twilio routes
// No endpoints defined yet - service is accessed via MessageController
@Controller('twilio')
export class TwilioController {
  // Inject TwilioService for potential future endpoints
  constructor(private readonly twilioService: TwilioService) {}
}
