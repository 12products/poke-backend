import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { Prisma, User } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { isValidPhoneNumber } from '../utils'

export interface UserStats {
  totalReminders: number
  activeReminders: number
  completedToday: number
  currentStreak: number
}

export interface UserWithReminders extends User {
  reminders: any[]
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private readonly db: DatabaseService) {}

  async onboard(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.findOne({ id: data.id })

    if (user) {
      this.logger.log(`User ${data.id} already exists, returning existing user`)
      return user
    }

    this.logger.log(`Creating new user with id: ${data.id}`)
    return this.db.user.create({ data })
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    if (data.phone && !isValidPhoneNumber(data.phone)) {
      throw new Error('Invalid phone number format')
    }
    return this.db.user.create({ data })
  }

  findAll(): Promise<User[]> {
    return this.db.user.findMany()
  }

  findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.db.user.findUnique({ where })
  }

  async findOneOrFail(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.db.user.findUnique({ where })
    if (!user) {
      throw new NotFoundException(`User not found`)
    }
    return user
  }

  async findWithReminders(userId: string): Promise<UserWithReminders | null> {
    return this.db.user.findUnique({
      where: { id: userId },
      include: { reminders: true },
    })
  }

  update({
    where,
    data,
  }: {
    where: Prisma.UserWhereUniqueInput
    data: Prisma.UserUpdateInput
  }): Promise<User> {
    return this.db.user.update({ where, data })
  }

  remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    this.logger.warn(`Deleting user: ${JSON.stringify(where)}`)
    return this.db.user.delete({ where })
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.findWithReminders(userId)
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`)
    }

    const reminders = user.reminders || []

    return {
      totalReminders: reminders.length,
      activeReminders: reminders.filter((r) => r.active !== false).length,
      completedToday: 0,
      currentStreak: 0,
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      take: 10,
    })
  }

  async countUsers(): Promise<number> {
    return this.db.user.count()
  }

  async getRecentUsers(limit: number = 10): Promise<User[]> {
    return this.db.user.findMany({
      orderBy: { id: 'desc' },
      take: limit,
    })
  }
}
