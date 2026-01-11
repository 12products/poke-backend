import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as twilio from 'twilio'
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message'

import { DEFAULT_CONFIG } from '../constants'
import { generateMessageId } from '../utils'

export interface SendMessageResult {
  success: boolean
  messageId: string
  twilioSid?: string
  error?: string
}

export interface MessageStats {
  sent: number
  delivered: number
  failed: number
}

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
    }
  }

  onModuleInit() {
    if (this.isConfigured) {
      this.logger.log('Twilio service initialized successfully')
    } else {
      this.logger.warn('Twilio service not configured - SMS features disabled')
    }
  }

  isReady(): boolean {
    return this.isConfigured
  }

  // Used to respond to texts we receive from users
  async respondToMessage(pokeResponse: string): Promise<string> {
    const twimlResponse = new this.twiml.MessagingResponse()
    twimlResponse.message(pokeResponse)
    return twimlResponse.toString()
  }

  // Used to send texts to users with retry logic
  async sendMessage(body: string, phone: string): Promise<SendMessageResult> {
    const messageId = generateMessageId()

    if (!this.isConfigured) {
      this.logger.warn(`Twilio not configured, skipping message to ${phone}`)
      return {
        success: false,
        messageId,
        error: 'Twilio service not configured',
      }
    }

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= DEFAULT_CONFIG.maxRetries; attempt++) {
      try {
        this.logger.log(`Sending message to ${phone} (attempt ${attempt}/${DEFAULT_CONFIG.maxRetries})`)

        const sentMessage = await this.twilioClient.messages.create({
          body,
          from: this.twilioPhone,
          to: phone,
        })

        this.logger.log(`Message sent successfully: ${sentMessage.sid}`)

        return {
          success: true,
          messageId,
          twilioSid: sentMessage.sid,
        }
      } catch (error) {
        lastError = error
        this.logger.error(`Failed to send message (attempt ${attempt}): ${error.message}`)

        if (attempt < DEFAULT_CONFIG.maxRetries) {
          const delay = DEFAULT_CONFIG.retryDelayMs * attempt
          this.logger.log(`Retrying in ${delay}ms...`)
          await this.delay(delay)
        }
      }
    }

    return {
      success: false,
      messageId,
      error: lastError?.message || 'Unknown error',
    }
  }

  // Send a message without retry logic for time-sensitive messages
  async sendMessageImmediate(body: string, phone: string): Promise<MessageInstance> {
    if (!this.isConfigured) {
      throw new Error('Twilio service not configured')
    }

    this.logger.log(`Sending immediate message to ${phone}`)
    return this.twilioClient.messages.create({
      body,
      from: this.twilioPhone,
      to: phone,
    })
  }

  // Get message delivery status
  async getMessageStatus(twilioSid: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Twilio service not configured')
    }

    const message = await this.twilioClient.messages(twilioSid).fetch()
    return message.status
  }

  // Validate webhook signature for security
  validateWebhook(signature: string, url: string, params: Record<string, string>): boolean {
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    return twilio.validateRequest(authToken, signature, url, params)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
