import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as twilio from 'twilio'

@Injectable()
export class TwilioService {
  private twilioClient: twilio.Twilio
  private twilioPhone: string
  private twiml: twilio.TwimlInterface

  constructor(private readonly configService: ConfigService) {
    const accountID = this.configService.get<string>('TWILIO_ACCOUNT_ID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE')
    this.twilioClient = twilio(accountID, authToken)
    this.twiml = twilio.twiml
  }

  async respondToMessage(pokeResponse: string) {
    const twimlResponse = new this.twiml.MessagingResponse()
    twimlResponse.message(pokeResponse)
    return twimlResponse.toString()
  }

  async sendMessage(body: string, phone: string) {
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
    return this.twilioClient.messages.create({
      body,
      from: this.twilioPhone,
      to: formattedPhone,
    })
  }
}
