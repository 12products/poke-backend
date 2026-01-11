import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { Prisma, User } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { isValidPhoneNumber } from '../utils'

export interface UserProfile {
  id: string
  phone: string
  activeSubscription: boolean
  reminderCount: number
  createdAt: Date
  lastActiveAt: Date | null
}

export interface UserPreferences {
  timezone: string
  notificationsEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private readonly db: DatabaseService) {}

  async onboard(data: Prisma.UserCreateInput): Promise<User> {
    const existingUser = await this.findOne({ id: data.id })

    if (existingUser) {
      this.logger.log(`User ${data.id} already exists, returning existing user`)
      return existingUser
    }

    this.logger.log(`Creating new user ${data.id}`)
    return this.db.user.create({ data })
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    this.logger.log(`Creating user with phone ${data.phone}`)
    return this.db.user.create({ data })
  }

  findAll(): Promise<User[]> {
    return this.db.user.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.db.user.findUnique({ where })
  }

  async findOneOrFail(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.db.user.findUnique({ where })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.findOneOrFail({ id: userId })
    const reminderCount = await this.db.reminder.count({
      where: { userId },
    })

    return {
      id: user.id,
      phone: user.phone,
      activeSubscription: user.activeSubscription,
      reminderCount,
      createdAt: user.createdAt,
      lastActiveAt: user.updatedAt,
    }
  }

  async update({
    where,
    data,
  }: {
    where: Prisma.UserWhereUniqueInput
    data: Prisma.UserUpdateInput
  }): Promise<User> {
    const user = await this.findOneOrFail(where)
    this.logger.log(`Updating user ${user.id}`)
    return this.db.user.update({ where, data })
  }

  async updatePhone(userId: string, phone: string): Promise<User> {
    if (!isValidPhoneNumber(phone)) {
      throw new Error('Invalid phone number format')
    }

    this.logger.log(`Updating phone for user ${userId}`)
    return this.db.user.update({
      where: { id: userId },
      data: { phone },
    })
  }

  async remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.findOneOrFail(where)

    // Delete all user's reminders first
    await this.db.reminder.deleteMany({
      where: { userId: user.id },
    })

    this.logger.log(`Removing user ${user.id} and all associated data`)
    return this.db.user.delete({ where })
  }

  async deactivate(userId: string): Promise<User> {
    this.logger.log(`Deactivating user ${userId}`)
    return this.db.user.update({
      where: { id: userId },
      data: { activeSubscription: false },
    })
  }

  async activate(userId: string): Promise<User> {
    this.logger.log(`Activating user ${userId}`)
    return this.db.user.update({
      where: { id: userId },
      data: { activeSubscription: true },
    })
  }

  async countActiveUsers(): Promise<number> {
    return this.db.user.count({
      where: { activeSubscription: true },
    })
  }
}
