import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as twilio from 'twilio'

interface MessageResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: Date
}

@Injectable()
export class TwilioService implements OnModuleInit {
  private readonly logger = new Logger(TwilioService.name)
  private twilioClient: twilio.Twilio
  private twilioPhone: string
  private twiml: twilio.TwimlInterface
  private messageCount = 0
  private errorCount = 0

  constructor(private readonly configService: ConfigService) {
    const accountID = this.configService.get<string>('TWILIO_ACCOUNT_ID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE')
    this.twilioClient = twilio(accountID, authToken)
    this.twiml = twilio.twiml
  }

  onModuleInit() {
    this.logger.log('TwilioService initialized')
    this.logger.log(`Using phone number: ${this.maskPhone(this.twilioPhone)}`)
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '****'
    return `****${phone.slice(-4)}`
  }

  // used to respond to texts we receive from users
  async respondToMessage(pokeResponse: string): Promise<string> {
    const twimlResponse = new this.twiml.MessagingResponse()
    twimlResponse.message(pokeResponse)
    return twimlResponse.toString()
  }

  // used to send texts to users with retry logic
  async sendMessage(body: string, phone: string, maxRetries = 3): Promise<MessageResult> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Sending message to ${this.maskPhone(phone)} (attempt ${attempt}/${maxRetries})`)

        const sentMessage = await this.twilioClient.messages.create({
          body,
          from: this.twilioPhone,
          to: phone,
        })

        this.messageCount++
        this.logger.log(`Message sent successfully: ${sentMessage.sid}`)

        return {
          success: true,
          messageId: sentMessage.sid,
          timestamp: new Date(),
        }
      } catch (error) {
        lastError = error as Error
        this.errorCount++
        this.logger.warn(`Failed to send message (attempt ${attempt}/${maxRetries}): ${lastError.message}`)

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000
          await this.sleep(delay)
        }
      }
    }

    this.logger.error(`All ${maxRetries} attempts failed for ${this.maskPhone(phone)}`)
    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      timestamp: new Date(),
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  getStats(): { messageCount: number; errorCount: number; successRate: string } {
    const total = this.messageCount + this.errorCount
    const successRate = total > 0
      ? ((this.messageCount / total) * 100).toFixed(2) + '%'
      : 'N/A'

    return {
      messageCount: this.messageCount,
      errorCount: this.errorCount,
      successRate,
    }
  }

  async verifyPhoneNumber(phone: string): Promise<boolean> {
    try {
      const lookup = await this.twilioClient.lookups.v1
        .phoneNumbers(phone)
        .fetch()
      return !!lookup.phoneNumber
    } catch {
      return false
    }
  }
}
