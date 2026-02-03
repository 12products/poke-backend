// Twilio service - handles all SMS communication
// This service abstracts Twilio API interactions
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
// Import the Twilio SDK for sending SMS messages
import * as twilio from 'twilio'

// Injectable service for Twilio operations
@Injectable()
export class TwilioService {
  // Twilio client instance for API calls
  private twilioClient: twilio.Twilio
  // The phone number we send messages from
  private twilioPhone: string
  // TwiML interface for generating XML responses
  private twiml: twilio.TwimlInterface

  // Initialize Twilio with credentials from environment
  constructor(private readonly configService: ConfigService) {
    // Get Twilio credentials from config
    const accountID = this.configService.get<string>('TWILIO_ACCOUNT_ID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    // Store the Twilio phone number for outgoing messages
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE')
    // Initialize the Twilio client with credentials
    this.twilioClient = twilio(accountID, authToken)
    // Store reference to TwiML for response generation
    this.twiml = twilio.twiml
  }

  // Generate a TwiML response for incoming webhooks
  // used to respond to texts we recieve from users
  async respondToMessage(pokeResponse: string) {
    // Create a new MessagingResponse object
    const twimlResponse = new this.twiml.MessagingResponse()
    // Add the message to the response
    twimlResponse.message(pokeResponse)
    // Convert to XML string for Twilio webhook response
    return twimlResponse.toString()
  }

  // Send an outbound SMS message to a user
  // used to send texts to users
  async sendMessage(body: string, phone: string) {
    // Use Twilio API to create and send the message
    const sentMessage = await this.twilioClient.messages.create({
      body, // Message content
      from: this.twilioPhone, // Our Twilio number
      to: phone, // User's phone number
    })
    // Return the sent message object for logging/tracking
    return sentMessage
  }
}
