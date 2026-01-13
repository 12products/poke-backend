import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as twilio from 'twilio'

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface MessageStatus {
  sid: string
  status: string
  dateCreated: Date
  dateSent: Date | null
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name)
  private twilioClient: twilio.Twilio
  private twilioPhone: string
  private twiml: twilio.TwimlInterface
  private isConfigured: boolean

  constructor(private readonly configService: ConfigService) {
    const accountID = this.configService.get<string>('TWILIO_ACCOUNT_ID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE')

    if (accountID && authToken) {
      this.twilioClient = twilio(accountID, authToken)
      this.twiml = twilio.twiml
      this.isConfigured = true
      this.logger.log('Twilio client initialized successfully')
    } else {
      this.isConfigured = false
      this.logger.warn('Twilio credentials not configured - SMS functionality disabled')
    }
  }

  /**
   * Check if Twilio is properly configured
   */
  isReady(): boolean {
    return this.isConfigured
  }

  /**
   * Respond to incoming text messages from users
   */
  async respondToMessage(pokeResponse: string): Promise<string> {
    if (!this.isConfigured) {
      this.logger.warn('Cannot respond - Twilio not configured')
      return ''
    }

    const twimlResponse = new this.twiml.MessagingResponse()
    twimlResponse.message(pokeResponse)
    this.logger.debug(`Generated TwiML response for message`)
    return twimlResponse.toString()
  }

  /**
   * Send an SMS message to a user
   */
  async sendMessage(body: string, phone: string): Promise<SendMessageResult> {
    if (!this.isConfigured) {
      this.logger.warn('Cannot send message - Twilio not configured')
      return { success: false, error: 'Twilio not configured' }
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone)
      this.logger.log(`Sending message to ${this.maskPhone(formattedPhone)}`)

      const sentMessage = await this.twilioClient.messages.create({
        body,
        from: this.twilioPhone,
        to: formattedPhone,
      })

      this.logger.log(`Message sent successfully: ${sentMessage.sid}`)
      return {
        success: true,
        messageId: sentMessage.sid,
      }
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Get the status of a previously sent message
   */
  async getMessageStatus(messageSid: string): Promise<MessageStatus | null> {
    if (!this.isConfigured) {
      return null
    }

    try {
      const message = await this.twilioClient.messages(messageSid).fetch()
      return {
        sid: message.sid,
        status: message.status,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
      }
    } catch (error) {
      this.logger.error(`Failed to fetch message status: ${error.message}`)
      return null
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return `+${cleaned}`
    }
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    }
    return `+${cleaned}`
  }

  /**
   * Mask phone number for logging (show last 4 digits only)
   */
  private maskPhone(phone: string): string {
    if (phone.length <= 4) return '****'
    return '*'.repeat(phone.length - 4) + phone.slice(-4)
  }
}
