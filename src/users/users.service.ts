import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common'

import { Prisma, User } from '@prisma/client'
import { DatabaseService } from '../database/database.service'

export interface UserStats {
  totalReminders: number
  activeReminders: number
  completedReminders: number
  daysSinceJoined: number
}

export interface UserWithReminders extends User {
  reminders: Array<{ id: string; emoji: string; text: string }>
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private readonly db: DatabaseService) {}

  async onboard(data: Prisma.UserCreateInput): Promise<User> {
    this.logger.log(`Onboarding user ${data.id}`)
    const existingUser = await this.findOne({ id: data.id })

    if (existingUser) {
      this.logger.debug(`User ${data.id} already exists, returning existing`)
      return existingUser
    }

    this.logger.log(`Creating new user ${data.id}`)
    return this.create(data)
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      const user = await this.db.user.create({ data })
      this.logger.log(`Created user ${user.id}`)
      return user
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this phone number already exists')
      }
      throw error
    }
  }

  async findAll(): Promise<User[]> {
    this.logger.debug('Fetching all users')
    return this.db.user.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async findAllWithReminders(): Promise<UserWithReminders[]> {
    this.logger.debug('Fetching all users with reminders')
    return this.db.user.findMany({
      include: {
        reminders: {
          select: {
            id: true,
            emoji: true,
            text: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<UserWithReminders[]>
  }

  async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    this.logger.debug(`Finding user: ${JSON.stringify(where)}`)
    return this.db.user.findUnique({ where })
  }

  async findOneOrFail(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.findOne(where)
    if (!user) {
      throw new NotFoundException(`User not found`)
    }
    return user
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.findOne({ phone })
  }

  async update({
    where,
    data,
  }: {
    where: Prisma.UserWhereUniqueInput
    data: Prisma.UserUpdateInput
  }): Promise<User> {
    this.logger.log(`Updating user ${JSON.stringify(where)}`)
    await this.findOneOrFail(where)
    return this.db.user.update({ where, data })
  }

  async updatePhone(userId: string, newPhone: string): Promise<User> {
    const existing = await this.findByPhone(newPhone)
    if (existing && existing.id !== userId) {
      throw new ConflictException('Phone number already in use')
    }
    return this.update({
      where: { id: userId },
      data: { phone: newPhone },
    })
  }

  async remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    this.logger.log(`Removing user ${JSON.stringify(where)}`)
    await this.findOneOrFail(where)

    // Delete associated reminders first
    await this.db.reminder.deleteMany({
      where: { userId: where.id },
    })

    return this.db.user.delete({ where })
  }

  async getStats(userId: string): Promise<UserStats> {
    const user = await this.findOneOrFail({ id: userId })

    const reminders = await this.db.reminder.findMany({
      where: { userId },
    })

    const daysSinceJoined = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      totalReminders: reminders.length,
      activeReminders: reminders.length, // All reminders are considered active
      completedReminders: 0, // Would need completion tracking
      daysSinceJoined,
    }
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const user = await this.findOne({ id: userId })
    return !!user?.activeSubscription
  }

  async setSubscription(userId: string, subscriptionId: string | null): Promise<User> {
    return this.update({
      where: { id: userId },
      data: { activeSubscription: subscriptionId },
    })
  }

  async countUsers(): Promise<number> {
    return this.db.user.count()
  }

  async countUsersWithSubscription(): Promise<number> {
    return this.db.user.count({
      where: {
        activeSubscription: { not: null },
      },
    })
  }
}
