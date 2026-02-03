// Twilio Controller
// Controller for Twilio-related HTTP endpoints
// Currently empty - the webhook is handled in MessageController
import { Controller } from '@nestjs/common'
import { TwilioService } from './twilio.service'

// Routes would be prefixed with /v1/twilio
// But this controller doesn't define any routes yet
@Controller('twilio')
export class TwilioController {
  // Inject the Twilio service
  // Available for future endpoints if needed
  constructor(private readonly twilioService: TwilioService) {}

  // Note: No endpoints defined here
  // The SMS webhook is handled by MessageController.receiveMessage()
  // This controller could be used for other Twilio features in the future
  // like voice calls, status callbacks, etc.
}
