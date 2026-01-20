import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as twilio from 'twilio'

export interface SendMessageResult {
  sid: string
  status: string
  to: string
  dateCreated: Date
}

export interface TwilioConfig {
  accountId: string
  authToken: string
  phone: string
}

@Injectable()
export class TwilioService implements OnModuleInit {
  private readonly logger = new Logger(TwilioService.name)
  private twilioClient: twilio.Twilio
  private twilioPhone: string
  private twiml: twilio.TwimlInterface
  private isConfigured = false

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const accountID = this.configService.get<string>('TWILIO_ACCOUNT_ID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE') || ''

    if (!accountID || !authToken) {
      this.logger.warn('Twilio credentials not configured - SMS features will be disabled')
      return
    }

    this.twilioClient = twilio(accountID, authToken)
    this.twiml = twilio.twiml
    this.isConfigured = true
    this.logger.log('Twilio service initialized successfully')
  }

  isReady(): boolean {
    return this.isConfigured
  }

  async respondToMessage(pokeResponse: string): Promise<string> {
    this.logger.debug(`Creating TwiML response: "${pokeResponse}"`)

    const twimlResponse = new this.twiml.MessagingResponse()
    twimlResponse.message(pokeResponse)
    return twimlResponse.toString()
  }

  async sendMessage(body: string, phone: string): Promise<SendMessageResult> {
    if (!this.isConfigured) {
      this.logger.error('Twilio is not configured - cannot send message')
      throw new Error('Twilio service is not configured')
    }

    const formattedPhone = this.formatPhoneNumber(phone)
    this.logger.log(`Sending SMS to: ${this.maskPhoneNumber(formattedPhone)}`)

    try {
      const sentMessage = await this.twilioClient.messages.create({
        body,
        from: this.twilioPhone,
        to: formattedPhone,
      })

      this.logger.log(`Message sent successfully, SID: ${sentMessage.sid}`)

      return {
        sid: sentMessage.sid,
        status: sentMessage.status,
        to: sentMessage.to,
        dateCreated: sentMessage.dateCreated,
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`)
      throw error
    }
  }

  async sendBulkMessages(
    messages: Array<{ body: string; phone: string }>
  ): Promise<SendMessageResult[]> {
    this.logger.log(`Sending ${messages.length} bulk messages`)

    const results: SendMessageResult[] = []
    for (const message of messages) {
      try {
        const result = await this.sendMessage(message.body, message.phone)
        results.push(result)
      } catch (error) {
        this.logger.error(`Failed to send message to ${this.maskPhoneNumber(message.phone)}`)
      }
    }

    this.logger.log(`Bulk send complete: ${results.length}/${messages.length} successful`)
    return results
  }

  async getMessageStatus(messageSid: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Twilio service is not configured')
    }

    try {
      const message = await this.twilioClient.messages(messageSid).fetch()
      return message.status
    } catch (error) {
      this.logger.error(`Failed to fetch message status: ${error.message}`)
      throw error
    }
  }

  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('+')) {
      return cleaned
    }
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`
    }
    return `+${cleaned}`
  }

  private maskPhoneNumber(phone: string): string {
    if (phone.length < 6) return '****'
    return phone.slice(0, 4) + '****' + phone.slice(-2)
  }
}
