import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as twilio from 'twilio'

export interface MessageResult {
  success: boolean
  messageId?: string
  error?: string
  timestamp: Date
}

export interface TwilioStats {
  messagesSent: number
  messagesReceived: number
  lastMessageTime: Date | null
}

@Injectable()
export class TwilioService implements OnModuleInit {
  private readonly logger = new Logger(TwilioService.name)
  private twilioClient: twilio.Twilio
  private twilioPhone: string
  private twiml: twilio.TwimlInterface
  private messagesSent = 0
  private messagesReceived = 0
  private lastMessageTime: Date | null = null

  constructor(private readonly configService: ConfigService) {
    const accountID = this.configService.get<string>('TWILIO_ACCOUNT_ID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE')
    this.twilioClient = twilio(accountID, authToken)
    this.twiml = twilio.twiml
  }

  async onModuleInit() {
    if (this.twilioPhone) {
      this.logger.log(`Twilio service initialized with phone: ${this.maskPhone(this.twilioPhone)}`)
    } else {
      this.logger.warn('Twilio phone number not configured')
    }
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 4) return '****'
    return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4)
  }

  // used to respond to texts we receive from users
  async respondToMessage(pokeResponse: string): Promise<string> {
    this.messagesReceived++
    const twimlResponse = new this.twiml.MessagingResponse()
    twimlResponse.message(pokeResponse)
    return twimlResponse.toString()
  }

  // used to send texts to users
  async sendMessage(body: string, phone: string): Promise<MessageResult> {
    try {
      const sentMessage = await this.twilioClient.messages.create({
        body,
        from: this.twilioPhone,
        to: phone,
      })
      this.messagesSent++
      this.lastMessageTime = new Date()
      this.logger.log(`Message sent to ${this.maskPhone(phone)}: ${sentMessage.sid}`)
      return {
        success: true,
        messageId: sentMessage.sid,
        timestamp: this.lastMessageTime,
      }
    } catch (error) {
      this.logger.error(`Failed to send message to ${this.maskPhone(phone)}`, error)
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      }
    }
  }

  async sendBulkMessages(
    messages: Array<{ body: string; phone: string }>
  ): Promise<MessageResult[]> {
    const results: MessageResult[] = []
    for (const msg of messages) {
      const result = await this.sendMessage(msg.body, msg.phone)
      results.push(result)
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return results
  }

  getStats(): TwilioStats {
    return {
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      lastMessageTime: this.lastMessageTime,
    }
  }

  async verifyPhoneNumber(phone: string): Promise<boolean> {
    try {
      const lookup = await this.twilioClient.lookups.v2.phoneNumbers(phone).fetch()
      return lookup.valid
    } catch (error) {
      this.logger.warn(`Phone verification failed for ${this.maskPhone(phone)}`)
      return false
    }
  }

  async getMessageHistory(limit: number = 10): Promise<any[]> {
    try {
      const messages = await this.twilioClient.messages.list({
        from: this.twilioPhone,
        limit,
      })
      return messages.map((m) => ({
        sid: m.sid,
        to: this.maskPhone(m.to),
        status: m.status,
        dateSent: m.dateSent,
      }))
    } catch (error) {
      this.logger.error('Failed to fetch message history', error)
      return []
    }
  }
}
