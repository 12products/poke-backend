import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as twilio from 'twilio'

@Injectable()
export class TwilioService implements OnModuleInit {
  private readonly logger = new Logger(TwilioService.name)
  private twilioClient: twilio.Twilio
  private twilioPhone: string
  private twiml: twilio.TwimlInterface
  private isConfigured = false

  constructor(private readonly configService: ConfigService) {
    const accountID = this.configService.get<string>('TWILIO_ACCOUNT_ID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE')

    if (accountID && authToken && this.twilioPhone) {
      this.twilioClient = twilio(accountID, authToken)
      this.twiml = twilio.twiml
      this.isConfigured = true
    } else {
      this.logger.warn('Twilio credentials not fully configured - SMS functionality disabled')
    }
  }

  onModuleInit() {
    if (this.isConfigured) {
      this.logger.log('Twilio service initialized successfully')
    }
  }

  isReady(): boolean {
    return this.isConfigured
  }
  // used to respond to texts we recieve from users
  async respondToMessage(pokeResponse: string) {
    const twimlResponse = new this.twiml.MessagingResponse()
    twimlResponse.message(pokeResponse)
    return twimlResponse.toString()
  }

  // used to send texts to users
  async sendMessage(body: string, phone: string) {
    if (!this.isConfigured) {
      this.logger.warn(`Twilio not configured - would have sent to ${phone}: ${body.substring(0, 50)}...`)
      return null
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`

    this.logger.debug(`Sending message to ${formattedPhone}`)

    try {
      const sentMessage = await this.twilioClient.messages.create({
        body,
        from: this.twilioPhone,
        to: formattedPhone,
      })
      this.logger.log(`Message sent successfully: ${sentMessage.sid}`)
      return sentMessage
    } catch (error) {
      this.logger.error(`Failed to send message to ${formattedPhone}: ${error.message}`)
      throw error
    }
  }

  async getMessageStatus(messageSid: string) {
    if (!this.isConfigured) {
      return null
    }

    try {
      const message = await this.twilioClient.messages(messageSid).fetch()
      return {
        sid: message.sid,
        status: message.status,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch message status: ${error.message}`)
      return null
    }
  }
}
