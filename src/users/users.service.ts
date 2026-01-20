import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { Prisma, User } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { isValidPhoneNumber, formatPhoneNumber } from '../utils'

export interface UserStats {
  totalReminders: number
  activeReminders: number
  completedReminders: number
  streakDays: number
}

export interface UserPreferences {
  timezone: string
  notificationEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private readonly db: DatabaseService) {}

  async onboard(data: Prisma.UserCreateInput): Promise<User> {
    this.logger.log(`Onboarding user: ${data.id}`)
    const user = await this.findOne({ id: data.id })

    if (user) {
      this.logger.log(`User ${data.id} already exists, returning existing user`)
      return user
    }

    if (data.phone && !isValidPhoneNumber(data.phone)) {
      this.logger.warn(`Invalid phone number format for user ${data.id}`)
    }

    const newUser = await this.db.user.create({ data })
    this.logger.log(`Successfully onboarded new user: ${newUser.id}`)
    return newUser
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    this.logger.log(`Creating new user with phone: ${formatPhoneNumber(data.phone || '')}`)
    return this.db.user.create({ data })
  }

  async findAll(): Promise<User[]> {
    this.logger.debug('Fetching all users')
    return this.db.user.findMany()
  }

  async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.db.user.findUnique({ where })
  }

  async findOneOrFail(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.db.user.findUnique({ where })
    if (!user) {
      throw new NotFoundException(`User not found`)
    }
    return user
  }

  async findByPhone(phone: string): Promise<User | null> {
    const cleanPhone = phone.replace(/\D/g, '')
    return this.db.user.findUnique({ where: { phone: cleanPhone } })
  }

  async update({
    where,
    data,
  }: {
    where: Prisma.UserWhereUniqueInput
    data: Prisma.UserUpdateInput
  }): Promise<User> {
    this.logger.log(`Updating user: ${JSON.stringify(where)}`)
    return this.db.user.update({ where, data })
  }

  async remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    this.logger.log(`Removing user: ${JSON.stringify(where)}`)
    return this.db.user.delete({ where })
  }

  async getUserStats(userId: string): Promise<UserStats> {
    this.logger.debug(`Fetching stats for user: ${userId}`)

    const reminders = await this.db.reminder.findMany({
      where: { userId },
      include: { messages: true },
    })

    const activeReminders = reminders.filter((r) => {
      return r.messages?.some((m) => m.active)
    }).length

    return {
      totalReminders: reminders.length,
      activeReminders,
      completedReminders: reminders.length - activeReminders,
      streakDays: await this.calculateStreak(userId),
    }
  }

  private async calculateStreak(userId: string): Promise<number> {
    const messages = await this.db.message.findMany({
      where: {
        reminder: { userId },
        active: false,
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    })

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const message of messages) {
      const messageDate = new Date(message.updatedAt)
      messageDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor(
        (today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === streak) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const user = await this.findOne({ id: userId })
    return !!user?.activeSubscription
  }

  async getSubscriptionTier(userId: string): Promise<string> {
    const user = await this.findOne({ id: userId })
    return user?.activeSubscription || 'free'
  }

  async countUsers(): Promise<number> {
    return this.db.user.count()
  }

  async countActiveUsers(since: Date): Promise<number> {
    return this.db.user.count({
      where: {
        updatedAt: { gte: since },
      },
    })
  }
}
