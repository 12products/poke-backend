// Twilio Service
// Wrapper around the Twilio SDK for sending and receiving SMS messages
// This is our gateway to the outside world (SMS)
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as twilio from 'twilio' // Twilio SDK

// Injectable service for NestJS dependency injection
@Injectable()
export class TwilioService {
  // Twilio client instance - initialized in constructor
  private twilioClient: twilio.Twilio
  // Our Twilio phone number (the "from" number for outgoing SMS)
  private twilioPhone: string
  // TwiML interface for generating XML responses
  private twiml: twilio.TwimlInterface

  // Constructor - sets up the Twilio client with credentials from config
  constructor(private readonly configService: ConfigService) {
    // Get Twilio credentials from environment variables
    const accountID = this.configService.get<string>('TWILIO_ACCOUNT_ID')
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN')
    // Get our Twilio phone number
    this.twilioPhone = this.configService.get<string>('TWILIO_PHONE')
    // Initialize the Twilio client
    this.twilioClient = twilio(accountID, authToken)
    // Store reference to TwiML for generating responses
    this.twiml = twilio.twiml
  }

  // Generate a TwiML response for incoming messages
  // This is used to reply to texts we receive from users
  // TwiML is an XML format that Twilio understands
  async respondToMessage(pokeResponse: string) {
    // Create a new MessagingResponse object
    const twimlResponse = new this.twiml.MessagingResponse()
    // Add our message to the response
    twimlResponse.message(pokeResponse)
    // Convert to XML string for the HTTP response
    return twimlResponse.toString()
  }

  // Send an outgoing SMS message to a user
  // This is the main way we "poke" users
  async sendMessage(body: string, phone: string) {
    // Use the Twilio API to create and send the message
    const sentMessage = await this.twilioClient.messages.create({
      body, // The message content
      from: this.twilioPhone, // Our Twilio number
      to: phone, // The user's phone number
    })
    // Return the Twilio response (contains message ID, status, etc.)
    return sentMessage
  }
}
