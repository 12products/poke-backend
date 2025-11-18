import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { MessageService } from '../message/message.service'
import { format } from 'date-fns'

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly messageService: MessageService
  ) {}

  async getDemoInfo() {
    return {
      title: '🎭 Poke Demo System',
      description:
        'A personal accountability system that sends SMS reminders for your goals',
      features: [
        '📱 SMS-based reminders',
        '🔔 Customizable notification schedules',
        '✅ Goal tracking via text responses',
        '🎨 Personalized with emojis and colors',
        '🔄 Smart retry mechanism',
      ],
      demoUsers: [
        {
          name: 'Alice Johnson',
          phone: '+15555550101',
          profile: 'Fitness enthusiast',
          timezone: 'America/New_York',
        },
        {
          name: 'Bob Smith',
          phone: '+15555550102',
          profile: 'Professional development',
          timezone: 'America/Los_Angeles',
        },
        {
          name: 'Charlie Davis',
          phone: '+15555550103',
          profile: 'Mental health & creativity',
          timezone: 'America/Chicago',
        },
      ],
      endpoints: {
        'GET /demo/info': 'Get demo information (this endpoint)',
        'GET /demo/users': 'List all demo users',
        'GET /demo/reminders': 'List all reminders',
        'GET /demo/users/:phone/reminders': "Get a specific user's reminders",
        'POST /demo/send-reminder/:reminderId': 'Manually trigger a reminder',
        'POST /demo/simulate-response': 'Simulate user responding to a reminder',
        'GET /demo/stats': 'Get system statistics',
      },
      quickStart: [
        '1. Run: yarn prisma:seed:demo',
        '2. Explore endpoints above',
        '3. Try: POST /demo/send-reminder/{reminderId}',
        "4. Simulate response: POST /demo/simulate-response with {phone, emoji}",
      ],
    }
  }

  async getDemoUsers() {
    const users = await this.db.user.findMany({
      where: {
        phone: {
          in: ['+15555550101', '+15555550102', '+15555550103'],
        },
      },
      include: {
        reminders: {
          include: {
            message: true,
          },
        },
      },
    })

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      onboarded: user.onboarded,
      reminderCount: user.reminders.length,
      activeMessages: user.reminders.filter((r) => r.message?.active).length,
      reminders: user.reminders.map((r) => ({
        id: r.id,
        text: r.text,
        emoji: r.emoji,
        color: r.color,
        timeZone: r.timeZone,
        notificationTime: format(r.notificationTime, 'HH:mm'),
        notificationDays: this.formatDays(r.notificationDays),
        hasActiveMessage: r.message?.active || false,
      })),
    }))
  }

  async getAllReminders() {
    const reminders = await this.db.reminder.findMany({
      include: {
        user: true,
        message: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return reminders.map((r) => ({
      id: r.id,
      text: r.text,
      emoji: r.emoji,
      color: r.color,
      userName: r.user.name,
      userPhone: r.user.phone,
      timeZone: r.timeZone,
      notificationTime: format(r.notificationTime, 'HH:mm'),
      notificationDays: this.formatDays(r.notificationDays),
      hasActiveMessage: r.message?.active || false,
      messageNextSend: r.message?.nextSend,
      messageTries: r.message?.tries,
    }))
  }

  async getUserReminders(phone: string) {
    // Support both formats: with and without +
    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`

    const user = await this.db.user.findUnique({
      where: { phone: normalizedPhone },
      include: {
        reminders: {
          include: {
            message: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException(`User with phone ${normalizedPhone} not found`)
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
      reminders: user.reminders.map((r) => ({
        id: r.id,
        text: r.text,
        emoji: r.emoji,
        color: r.color,
        timeZone: r.timeZone,
        notificationTime: format(r.notificationTime, 'HH:mm'),
        notificationDays: this.formatDays(r.notificationDays),
        hasActiveMessage: r.message?.active || false,
        messageDetails: r.message
          ? {
              nextSend: r.message.nextSend,
              tries: r.message.tries,
              active: r.message.active,
            }
          : null,
      })),
    }
  }

  async triggerReminder(reminderId: string) {
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
      include: {
        user: true,
        message: true,
      },
    })

    if (!reminder) {
      throw new NotFoundException(`Reminder ${reminderId} not found`)
    }

    this.logger.log(`Manually triggering reminder ${reminderId}`)

    // Create or update the message
    const message = await this.messageService.create(reminderId)

    return {
      success: true,
      message: 'Reminder triggered successfully',
      reminder: {
        id: reminder.id,
        text: reminder.text,
        emoji: reminder.emoji,
        user: reminder.user.name,
        phone: reminder.user.phone,
      },
      messageSent: {
        id: message.id,
        nextSend: message.nextSend,
        tries: message.tries,
        active: message.active,
      },
      note: `SMS would be sent to ${reminder.user.phone} in production`,
    }
  }

  async simulateUserResponse(phone: string, emoji: string) {
    // Support both formats: with and without +
    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`

    const user = await this.db.user.findUnique({
      where: { phone: normalizedPhone },
      include: {
        reminders: {
          include: {
            message: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException(`User with phone ${normalizedPhone} not found`)
    }

    // Find the reminder that matches the emoji
    const matchingReminder = user.reminders.find((r) => r.emoji === emoji)

    if (!matchingReminder) {
      return {
        success: false,
        message: `No reminder found with emoji ${emoji} for user ${user.name}`,
        availableEmojis: user.reminders.map((r) => ({
          emoji: r.emoji,
          text: r.text,
        })),
      }
    }

    // Remove the message if it exists
    if (matchingReminder.message) {
      await this.messageService.remove({ reminderId: matchingReminder.id })
    }

    this.logger.log(
      `User ${user.name} responded with ${emoji} for reminder ${matchingReminder.id}`
    )

    return {
      success: true,
      message: 'Great work!',
      reminder: {
        text: matchingReminder.text,
        emoji: matchingReminder.emoji,
      },
      user: {
        name: user.name,
        phone: user.phone,
      },
      note: 'Message deactivated - user acknowledged the poke!',
    }
  }

  async getStats() {
    const totalUsers = await this.db.user.count()
    const totalReminders = await this.db.reminder.count()
    const activeMessages = await this.db.message.count({
      where: { active: true },
    })

    const demoUsers = await this.db.user.findMany({
      where: {
        phone: {
          in: ['+15555550101', '+15555550102', '+15555550103'],
        },
      },
      include: {
        reminders: {
          include: {
            message: true,
          },
        },
      },
    })

    const remindersByUser = demoUsers.map((user) => ({
      name: user.name,
      phone: user.phone,
      totalReminders: user.reminders.length,
      activeMessages: user.reminders.filter((r) => r.message?.active).length,
    }))

    const remindersByDay = await this.getRemindersByDay()

    return {
      overview: {
        totalUsers,
        totalReminders,
        activeMessages,
      },
      demoUsers: remindersByUser,
      reminderDistribution: remindersByDay,
      systemHealth: {
        status: 'operational',
        cronJobRunning: true,
        lastCheck: new Date().toISOString(),
      },
    }
  }

  private formatDays(days: number[]): string[] {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days.sort().map((d) => dayNames[d])
  }

  private async getRemindersByDay() {
    const reminders = await this.db.reminder.findMany()
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]

    reminders.forEach((reminder) => {
      reminder.notificationDays.forEach((day) => {
        dayCounts[day]++
      })
    })

    return dayNames.map((name, index) => ({
      day: name,
      count: dayCounts[index],
    }))
  }
}
