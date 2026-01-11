import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { Prisma, User } from '@prisma/client'
import { DatabaseService } from '../database/database.service'
import { isValidPhoneNumber } from '../utils'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private readonly db: DatabaseService) {}

  async onboard(data: Prisma.UserCreateInput): Promise<User> {
    this.logger.log(`Onboarding user with id: ${data.id}`)

    const user = await this.findOne({ id: data.id })

    if (user) {
      this.logger.log(`User ${data.id} already exists, returning existing user`)
      return user
    }

    if (data.phone && !isValidPhoneNumber(data.phone)) {
      this.logger.warn(`Invalid phone number format for user ${data.id}`)
    }

    const newUser = await this.db.user.create({ data })
    this.logger.log(`Successfully created new user ${newUser.id}`)
    return newUser
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
    this.logger.log(`Removing user: ${JSON.stringify(where)}`)
    return this.db.user.delete({ where })
  }

  async findByPhone(phone: string): Promise<User | null> {
    const normalizedPhone = phone.replace(/[\s\-()]/g, '')
    return this.db.user.findFirst({
      where: {
        phone: {
          contains: normalizedPhone,
        },
      },
    })
  }

  async getUserStats(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        reminders: true,
      },
    })

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`)
    }

    return {
      totalReminders: user.reminders.length,
      activeReminders: user.reminders.filter((r) => r.active).length,
      hasActiveSubscription: user.activeSubscription,
    }
  }
}
