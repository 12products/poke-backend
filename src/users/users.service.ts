import { Injectable, Logger } from '@nestjs/common'

import { Prisma, User } from '@prisma/client'
import { DatabaseService } from '../database/database.service'

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

    this.logger.log(`Creating new user ${data.id}`)
    return this.db.user.create({ data })
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data })
  }

  findAll(): Promise<User[]> {
    return this.db.user.findMany()
  }

  findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.db.user.findUnique({ where })
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { phoneNumber },
    })
  }

  async getUserStats(userId: string): Promise<{
    totalReminders: number
    activeSubscription: boolean
    createdAt: Date
  }> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: { reminders: true },
    })

    if (!user) {
      return null
    }

    return {
      totalReminders: user.reminders?.length || 0,
      activeSubscription: user.activeSubscription,
      createdAt: user.createdAt,
    }
  }

  update({
    where,
    data,
  }: {
    where: Prisma.UserWhereUniqueInput
    data: Prisma.UserUpdateInput
  }): Promise<User> {
    this.logger.log(`Updating user ${where.id}`)
    return this.db.user.update({ where, data })
  }

  async deactivate(where: Prisma.UserWhereUniqueInput): Promise<User> {
    this.logger.log(`Deactivating user ${where.id}`)
    return this.db.user.update({
      where,
      data: { activeSubscription: false },
    })
  }

  remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    this.logger.warn(`Deleting user ${where.id}`)
    return this.db.user.delete({ where })
  }
}
