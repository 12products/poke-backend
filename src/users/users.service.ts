import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { Prisma, User } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: DatabaseService) {}

  async onboard(data: Prisma.UserCreateInput): Promise<User> {
    const existingUser = await this.findOne({ id: data.id });

    if (existingUser) {
      this.logger.log(`User ${data.id} already exists, returning existing`);
      return existingUser;
    }

    this.logger.log(`Creating new user ${data.id}`);
    return this.create(data);
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    this.logger.log(`Creating user with email: ${data.email}`);
    return this.db.user.create({ data });
  }

  async findAll(): Promise<User[]> {
    return this.db.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.db.user.findUnique({ where });
  }

  async findOneOrThrow(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.findOne(where);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update({
    where,
    data,
  }: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const user = await this.findOne(where);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Updating user ${where.id}`);
    return this.db.user.update({ where, data });
  }

  async remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    const user = await this.findOne(where);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Deleting user ${where.id}`);
    return this.db.user.delete({ where });
  }

  async updateSubscription(
    userId: string,
    isActive: boolean
  ): Promise<User> {
    this.logger.log(
      `Updating subscription for user ${userId}: active=${isActive}`
    );
    return this.db.user.update({
      where: { id: userId },
      data: { activeSubscription: isActive },
    });
  }

  async getUserStats(userId: string): Promise<{
    totalReminders: number;
    activeReminders: number;
    hasSubscription: boolean;
  }> {
    const user = await this.findOneOrThrow({ id: userId });

    const reminders = await this.db.reminder.findMany({
      where: { userId },
    });

    return {
      totalReminders: reminders.length,
      activeReminders: reminders.filter((r) => r.isActive !== false).length,
      hasSubscription: user.activeSubscription || false,
    };
  }
}
