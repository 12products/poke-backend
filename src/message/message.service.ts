// Message service - core SMS messaging functionality
// Handles creating, sending, and managing reminder messages
import { Injectable, Logger } from '@nestjs/common'
// Cron decorators for scheduled tasks
import { Cron, CronExpression } from '@nestjs/schedule'

// Prisma types for database operations
import { Message, Prisma } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { TwilioService } from '../twilio/twilio.service'
// Utility functions for time calculations
import { getNotificationTime, getNextSendTime } from '../utils'

// Injectable service for message operations
@Injectable()
export class MessageService {
  // Logger instance for this service
  private readonly logger = new Logger(MessageService.name)

  // Inject database and Twilio services
  constructor(
    private readonly db: DatabaseService,
    private twilio: TwilioService
  ) {}

  // Create a new message for a reminder
  // This initiates the poke sequence for a user
  async create(reminderId: string): Promise<Message> {
    // Check if message already exists for this reminder
    // If so, remove it before creating a new one
    const hasMessage: Message | null = await this.findOne({ reminderId })

    // Clean up existing message to avoid duplicates
    if (hasMessage) {
      await this.remove({ reminderId })
    }

    // Calculate when the next send should occur
    const nextSend = getNextSendTime(new Date(), 1)
    // Log the message creation for debugging
    this.logger.log(
      `Creating message for reminder ${reminderId}, next send time ${nextSend}`
    )
    // Create the message record in the database
    const message = await this.db.message.create({
      data: {
        reminder: {
          connect: { id: reminderId },
        },
        nextSend,
        active: true,
      },
    })

    // Send the initial message immediately
    await this.sendMessage(reminderId)

    // Return the created message object
    return message
  }

  // Update an existing message record
  // Used for updating nextSend time and tries count
  async update({
    where,
    data,
  }: {
    where: Prisma.MessageWhereUniqueInput
    data: Prisma.MessageUpdateInput
  }): Promise<Message> {
    return this.db.message.update({ where, data })
  }

  // Remove a message from the database
  // Called when user acknowledges the poke
  async remove(where: Prisma.MessageWhereUniqueInput): Promise<Message> {
    return this.db.message.delete({ where })
  }

  // Get all messages from the database
  // Useful for debugging and admin purposes
  async findAll(): Promise<Message[]> {
    return this.db.message.findMany()
  }

  // Find a single message by unique identifier
  // Returns null if not found
  async findOne(
    where: Prisma.MessageWhereUniqueInput
  ): Promise<Message | null> {
    return await this.db.message.findUnique({ where })
  }

  // Send an SMS message via Twilio
  // Includes the reminder text and emoji for acknowledgment
  async sendMessage(reminderId: string) {
    // Fetch the reminder with associated user data
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
      include: {
        user: true,
      },
    })

    // Send the message through Twilio
    // Include instructions for user to respond with emoji
    const response = await this.twilio.sendMessage(
      `${reminder.text}.\n\nRespond with ${reminder.emoji} to acknowledge this poke!`,
      reminder.user.phone
    )
    // Log the Twilio response for monitoring
    this.logger.log(
      `Message sending to ${reminderId}, response from twillio ${response}`
    )
    return response
  }

  // Handle incoming SMS messages from users
  // This is the Twilio webhook handler
  async receiveMessage(req) {
    // Log the incoming message for debugging
    this.logger.log(`Received message from user: ${req.body.Body}`)

    // Default response if emoji doesn't match
    let pokeResponse = `We'll give you another poke in a bit!`

    // Extract and clean the user's response
    const userResponse = req.body.Body.trim()
    // Find the user by phone number (strip the + prefix)
    const user = await this.db.user.findUnique({
      where: { phone: req.body.From.replace('+', '') },
      include: {
        reminders: true,
      },
    })

    // If no user found, silently return
    if (!user) {
      return
    }

    // Check if the response matches any reminder emoji
    for (const reminder of user.reminders) {
      if (reminder.emoji === userResponse) {
        // User acknowledged the poke - remove the message
        this.remove({ reminderId: reminder.id })
        // Send positive feedback
        pokeResponse = 'Great work!'
        break
      }
    }

    // Log the response we're sending
    this.logger.log(`Received message from user ${user.id}`)
    this.logger.log(`Responding with: ${pokeResponse}`)

    // Send the response back via Twilio
    return await this.twilio.respondToMessage(pokeResponse)
  }

  // Cron job that runs every minute
  // Re-sends unacknowledged messages with backoff
  @Cron(CronExpression.EVERY_MINUTE)
  async resendMessage() {
    // Finds all messages with nextSend time as now
    // Only get active messages that are due to be sent
    const allMessages = await this.db.message.findMany({
      where: {
        AND: [
          {
            nextSend: {
              lte: getNotificationTime(new Date()),
            },
          },
          {
            active: true,
          },
        ],
      },

      include: {
        reminder: true,
      },
    })

    // Log how many messages we found
    this.logger.log(`Found ${allMessages.length} messages to send`)

    // Process each message that needs to be resent
    allMessages.forEach(async (message) => {
      // Send the message again
      await this.sendMessage(message.reminder.id)
      // Calculate next send time with backoff
      const nextSend = getNextSendTime(new Date(), message.tries)
      // Deactivate after 4 tries to prevent spam
      const active = message.tries < 4

      // Log the resend operation
      this.logger.log(
        `Resending message ${message.id} with tries ${
          message.tries
        }that matches nextSend of ${getNotificationTime(new Date())} `
      )

      // Update the message with new nextSend and increment tries
      await this.update({
        where: { id: message.id },
        data: { nextSend, tries: message.tries + 1, active },
      })
    })
  }
}
