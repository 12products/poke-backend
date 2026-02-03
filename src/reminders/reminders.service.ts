// Reminders Service
// Core business logic for reminder management
// Also handles the cron job that triggers reminder sending
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule' // For scheduled tasks
import { utcToZonedTime } from 'date-fns-tz' // Timezone conversion

import { Reminder, Prisma, User } from '@prisma/client'
import { MessageService } from '../message/message.service'
import { DatabaseService } from '../database/database.service'
import { emojis } from '../constants' // Our emoji collection
import { getNotificationTime } from '../utils'

/**
 * Helper function to get the next emoji index for a new reminder
 * We cycle through emojis sequentially to avoid duplicates
 *
 * @param reminders - Array of existing reminders
 * @returns The index of the next emoji to use
 */
const getNextIndex = (reminders: Reminder[]): number => {
  // Get the emoji of the last created reminder
  const lastEmoji = reminders[reminders.length - 1].emoji
  // Find where it is in our emoji array
  const lastEmojiIndex = emojis.indexOf(lastEmoji)
  // Return next index, wrapping around if needed (modulo)
  return lastEmojiIndex < 0 ? 0 : (lastEmojiIndex + 1) % emojis.length
}

// Mark as injectable so NestJS can handle dependency injection
@Injectable()
export class RemindersService {
  // Logger instance for this service - useful for debugging
  private readonly logger = new Logger(RemindersService.name)

  // Constructor injection - NestJS will provide these dependencies
  constructor(
    private readonly db: DatabaseService, // Database access via Prisma
    private readonly messageService: MessageService // For sending SMS messages
  ) {}

  // Create a new reminder for a user
  // Checks subscription status and assigns emoji
  async create(user, data: Prisma.ReminderCreateInput): Promise<Reminder> {
    // Get existing reminders for this user
    const currentReminders = await this.findAll(user.id)

    // Fetch the full user object to check subscription
    const currentUser: User = await this.db.user.findUnique({
      where: { id: user.id },
    })

    // Subscription check - free users can only have one reminder
    if (!currentUser.activeSubscription && currentReminders.length) {
      throw new Error('Need an active subscription for more reminders')
    }

    // Get the next emoji index
    // If user has existing reminders, cycle to next emoji
    // Otherwise, pick a random one for their first reminder
    const idx = currentReminders.length
      ? getNextIndex(currentReminders)
      : (Math.random() * emojis.length) | 0 // Bitwise OR 0 truncates to integer

    // Log the creation for debugging
    this.logger.log(
      `Creating reminder...${
        data.notificationTime
      } stored as ${getNotificationTime(new Date(data.notificationTime))} , ${
        data.notificationDays
      }}`
    )

    // Create the reminder in the database
    return this.db.reminder.create({
      data: {
        ...data, // Spread the input data
        emoji: emojis[idx], // Assign the selected emoji
        notificationTime: getNotificationTime(new Date(data.notificationTime)), // Normalize time
        user: {
          connect: { id: user.id }, // Link to the user
        },
      },
    })
  }

  // Get all reminders for a specific user
  async findAll(userId: string): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: {
        userId, // Filter by user
      },
    })
  }

  // Find a single reminder by ID
  // Returns null if the reminder doesn't belong to the user
  async findOne(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder | null> {
    const reminder = await this.db.reminder.findUnique({ where })
    // Authorization check - only return if user owns this reminder
    return reminder.userId === userId ? reminder : null
  }

  // Update an existing reminder
  // Includes ownership verification
  async update({
    where,
    data,
    userId,
  }: {
    where: Prisma.ReminderWhereUniqueInput
    data: Prisma.ReminderUpdateInput
    userId: string
  }): Promise<Reminder> {
    // First fetch the reminder to check ownership
    const reminder = await this.db.reminder.findUnique({ where })
    // Authorization check
    if (reminder.userId !== userId) return
    // Log the update operation
    this.logger.log(
      `Updating reminder ${reminder.id} with ${JSON.stringify(data)}`
    )
    // Perform the update
    return this.db.reminder.update({ where, data })
  }

  // Delete a reminder and its associated messages
  async remove(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder> {
    // Fetch reminder to verify ownership
    const reminder = await this.db.reminder.findUnique({ where })
    // Authorization check
    if (reminder.userId !== userId) return

    // Prisma doesn't support cascading deletes so we'll delete messages manually
    // This is a bit of a workaround - would be nice if Prisma supported this natively
    try {
      await this.db.message.deleteMany({
        where: {
          reminderId: reminder.id, // Delete all messages for this reminder
        },
      })
    } catch (e) {
      // Log error but continue with reminder deletion
      this.logger.error(
        `Failed to delete messages for reminder ${reminder.id} `
      )
    }

    // Log the deletion
    this.logger.log(`Removing reminder ${reminder.id}`)

    // Delete the reminder itself
    return this.db.reminder.delete({
      where: {
        id: where.id,
      },
    })
  }

  // CRON JOB: Runs every 5 minutes to check for reminders to send
  // This is the heart of the poke system!
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendReminders() {
    // Get current time for comparison
    const now = new Date()

    // Find all reminders that match the current notification time
    // We normalize the time to compare just hours and minutes
    let remindersToSend = await this.db.reminder.findMany({
      where: {
        notificationTime: getNotificationTime(now),
      },
    })

    // Filter by day of week - only send on configured days
    // We need to convert to user's local timezone for accurate day check
    remindersToSend = remindersToSend.filter((reminder) => {
      // Convert UTC to user's timezone
      const userLocalNow = utcToZonedTime(now, reminder.timeZone)
      // Check if today is one of the configured notification days
      return reminder.notificationDays.includes(userLocalNow.getDay())
    })

    // Log how many reminders we're about to send
    this.logger.log(`Found ${remindersToSend.length} reminders to send`)

    // Send each reminder via SMS
    remindersToSend.forEach((reminder) => {
      this.logger.log(
        `Sending reminder to ${reminder.emoji} ${
          reminder.id
        } at time ${getNotificationTime(now)}`
      )
      // Create a message (which triggers sending)
      this.messageService.create(reminder.id)
    })
  }
}
