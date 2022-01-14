import { Controller } from '@nestjs/common'
import { TwilioService } from './twilio.service'

@Controller('twilio')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}
}
