// Reminders service - manages user reminder schedules
// Core business logic for creating, updating, and triggering reminders
import { Injectable, Logger } from '@nestjs/common'
// Cron scheduling for automated reminder checks
import { Cron, CronExpression } from '@nestjs/schedule'
// Timezone conversion utility
import { utcToZonedTime } from 'date-fns-tz'

// Prisma types for type-safe database operations
import { Reminder, Prisma, User } from '@prisma/client'
import { MessageService } from '../message/message.service'
import { DatabaseService } from '../database/database.service'
// Available emojis for reminder identification
import { emojis } from '../constants'
// Time normalization utility
import { getNotificationTime } from '../utils'

// Helper function to get next emoji index
// Cycles through emojis array to ensure unique emojis per user
const getNextIndex = (reminders: Reminder[]): number => {
  // Get the emoji from the last reminder
  const lastEmoji = reminders[reminders.length - 1].emoji
  // Find its position in the emojis array
  const lastEmojiIndex = emojis.indexOf(lastEmoji)
  // Return next index, wrapping around if at end
  return lastEmojiIndex < 0 ? 0 : (lastEmojiIndex + 1) % emojis.length
}

// Injectable service for reminder operations
@Injectable()
export class RemindersService {
  // Logger for this service class
  private readonly logger = new Logger(RemindersService.name)

  // Inject required services
  constructor(
    private readonly db: DatabaseService,
    private readonly messageService: MessageService
  ) {}

  // Create a new reminder for a user
  // Assigns a unique emoji and normalizes notification time
  async create(user, data: Prisma.ReminderCreateInput): Promise<Reminder> {
    // Get user's existing reminders
    const currentReminders = await this.findAll(user.id)

    // Fetch the full user object
    const currentUser: User = await this.db.user.findUnique({
      where: { id: user.id },
    })

    // Check subscription status for additional reminders
    // Free users only get one reminder
    if (!currentUser.activeSubscription && currentReminders.length) {
      throw new Error('Need an active subscription for more reminders')
    }

    // Determine which emoji to assign
    // Either next in sequence or random for first reminder
    const idx = currentReminders.length
      ? getNextIndex(currentReminders)
      : (Math.random() * emojis.length) | 0

    // Log reminder creation details
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
        ...data,
        emoji: emojis[idx],
        // Normalize the notification time for consistent matching
        notificationTime: getNotificationTime(new Date(data.notificationTime)),
        // Connect to the user
        user: {
          connect: { id: user.id },
        },
      },
    })
  }

  // Get all reminders for a specific user
  // Returns array of reminder objects
  async findAll(userId: string): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: {
        userId,
      },
    })
  }

  // Find a single reminder by ID
  // Verifies the reminder belongs to the requesting user
  async findOne(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder | null> {
    const reminder = await this.db.reminder.findUnique({ where })
    // Only return if user owns this reminder
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
    // Fetch the reminder first
    const reminder = await this.db.reminder.findUnique({ where })
    // Verify ownership before updating
    if (reminder.userId !== userId) return
    // Log the update operation
    this.logger.log(
      `Updating reminder ${reminder.id} with ${JSON.stringify(data)}`
    )
    // Perform the update
    return this.db.reminder.update({ where, data })
  }

  // Delete a reminder and its associated messages
  // Includes ownership verification
  async remove(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder> {
    // Fetch the reminder
    const reminder = await this.db.reminder.findUnique({ where })
    // Verify ownership before deleting
    if (reminder.userId !== userId) return

    // Prisma doesn't support cascading deletes so we'll delete messages manually
    // Clean up any associated messages first
    try {
      await this.db.message.deleteMany({
        where: {
          reminderId: reminder.id,
        },
      })
    } catch (e) {
      // Log error but continue with deletion
      this.logger.error(
        `Failed to delete messages for reminder ${reminder.id} `
      )
    }

    // Log the removal
    this.logger.log(`Removing reminder ${reminder.id}`)

    // Delete the reminder from database
    return this.db.reminder.delete({
      where: {
        id: where.id,
      },
    })
  }

  // Cron job that runs every 5 minutes
  // Checks for reminders that should be triggered now
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendReminders() {
    // Get current time
    const now = new Date()

    // Find all reminders matching current time
    let remindersToSend = await this.db.reminder.findMany({
      where: {
        notificationTime: getNotificationTime(now),
      },
    })

    // Filter by day of week in user's timezone
    // Only send if today is in the user's notification days
    remindersToSend = remindersToSend.filter((reminder) => {
      // Convert current time to user's timezone
      const userLocalNow = utcToZonedTime(now, reminder.timeZone)
      // Check if current day is in notification days array
      return reminder.notificationDays.includes(userLocalNow.getDay())
    })

    // Log how many reminders we're processing
    this.logger.log(`Found ${remindersToSend.length} reminders to send`)

    // Create a message for each reminder that needs to be sent
    remindersToSend.forEach((reminder) => {
      // Log each reminder being sent
      this.logger.log(
        `Sending reminder to ${reminder.emoji} ${
          reminder.id
        } at time ${getNotificationTime(now)}`
      )
      // Create the message which triggers the SMS
      this.messageService.create(reminder.id)
    })
  }
}
