// Message Service
// Handles SMS message creation, sending, and retry logic
// Works with Twilio to deliver pokes to users
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Message, Prisma } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { TwilioService } from '../twilio/twilio.service'
import { getNotificationTime, getNextSendTime } from '../utils'

// Injectable service - NestJS handles instantiation
@Injectable()
export class MessageService {
  // Logger for this service - helps with debugging message flow
  private readonly logger = new Logger(MessageService.name)

  // Dependencies injected via constructor
  constructor(
    private readonly db: DatabaseService, // Database access
    private twilio: TwilioService // Twilio SMS service
  ) {}

  // Create a new message for a reminder and send it immediately
  // If a message already exists for this reminder, remove it first
  async create(reminderId: string): Promise<Message> {
    // Check if message already exists for this reminder
    // We only want one active message per reminder at a time
    const hasMessage: Message | null = await this.findOne({ reminderId })

    // If message exists, delete it first (fresh start)
    if (hasMessage) {
      await this.remove({ reminderId })
    }

    // Calculate when to retry if user doesn't respond
    const nextSend = getNextSendTime(new Date(), 1)

    // Log message creation for debugging
    this.logger.log(
      `Creating message for reminder ${reminderId}, next send time ${nextSend}`
    )

    // Create the message record in the database
    const message = await this.db.message.create({
      data: {
        reminder: {
          connect: { id: reminderId }, // Link to the reminder
        },
        nextSend, // When to retry
        active: true, // Message is active (will be retried if not acknowledged)
      },
    })

    // Send the message immediately via Twilio
    await this.sendMessage(reminderId)

    return message
  }

  // Update a message record (used for retry logic)
  async update({
    where,
    data,
  }: {
    where: Prisma.MessageWhereUniqueInput
    data: Prisma.MessageUpdateInput
  }): Promise<Message> {
    return this.db.message.update({ where, data })
  }

  // Remove a message (called when user acknowledges the poke)
  async remove(where: Prisma.MessageWhereUniqueInput): Promise<Message> {
    return this.db.message.delete({ where })
  }

  // Get all messages in the system
  async findAll(): Promise<Message[]> {
    return this.db.message.findMany()
  }

  // Find a specific message
  async findOne(
    where: Prisma.MessageWhereUniqueInput
  ): Promise<Message | null> {
    return await this.db.message.findUnique({ where })
  }

  // Send an SMS message via Twilio
  // This is the actual SMS sending logic
  async sendMessage(reminderId: string) {
    // Fetch the reminder with the user info (we need phone number)
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
      include: {
        user: true, // Include user to get their phone number
      },
    })

    // Compose and send the message
    // The message includes the reminder text and the emoji to respond with
    const response = await this.twilio.sendMessage(
      `${reminder.text}.\n\nRespond with ${reminder.emoji} to acknowledge this poke!`,
      reminder.user.phone
    )

    // Log the Twilio response
    this.logger.log(
      `Message sending to ${reminderId}, response from twillio ${response}`
    )
    return response
  }

  // Handle incoming SMS messages from users
  // Called by the Twilio webhook when a user responds
  async receiveMessage(req) {
    // Log what the user sent us
    this.logger.log(`Received message from user: ${req.body.Body}`)

    // Default response - will be overwritten if user acknowledged correctly
    let pokeResponse = `We'll give you another poke in a bit!`

    // Get the user's response (trim whitespace)
    const userResponse = req.body.Body.trim()

    // Find the user by their phone number
    // Twilio sends phone with + prefix, we store without it
    const user = await this.db.user.findUnique({
      where: { phone: req.body.From.replace('+', '') },
      include: {
        reminders: true, // Include reminders to check for emoji match
      },
    })

    // If no user found, silently exit
    // This could happen if someone texts our number who isn't a user
    if (!user) {
      return
    }

    // Check if the user's response matches any of their reminder emojis
    for (const reminder of user.reminders) {
      if (reminder.emoji === userResponse) {
        // Match found! Remove the pending message
        this.remove({ reminderId: reminder.id })
        // Update response to congratulate them
        pokeResponse = 'Great work!'
        break // Stop checking after first match
      }
    }

    // Log the interaction
    this.logger.log(`Received message from user ${user.id}`)
    this.logger.log(`Responding with: ${pokeResponse}`)

    // Send the response back via Twilio
    return await this.twilio.respondToMessage(pokeResponse)
  }

  // CRON JOB: Runs every minute to resend unacknowledged messages
  // This implements the retry/poke-again functionality
  @Cron(CronExpression.EVERY_MINUTE)
  async resendMessage() {
    // Find all messages that are due to be resent
    // They must be active AND have nextSend time in the past
    const allMessages = await this.db.message.findMany({
      where: {
        AND: [
          {
            nextSend: {
              lte: getNotificationTime(new Date()), // Due or overdue
            },
          },
          {
            active: true, // Still active (not acknowledged or expired)
          },
        ],
      },

      include: {
        reminder: true, // Include reminder info
      },
    })

    // Log how many messages we're retrying
    this.logger.log(`Found ${allMessages.length} messages to send`)

    // Process each message that needs to be resent
    allMessages.forEach(async (message) => {
      // Send the message again
      await this.sendMessage(message.reminder.id)

      // Calculate next retry time
      const nextSend = getNextSendTime(new Date(), message.tries)

      // Deactivate after 4 tries (stop pestering the user)
      const active = message.tries < 4

      // Log the resend attempt
      this.logger.log(
        `Resending message ${message.id} with tries ${
          message.tries
        }that matches nextSend of ${getNotificationTime(new Date())} `
      )

      // Update the message with new retry info
      await this.update({
        where: { id: message.id },
        data: { nextSend, tries: message.tries + 1, active },
      })
    })
  }
}
