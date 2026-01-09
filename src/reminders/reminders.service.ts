import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { utcToZonedTime } from 'date-fns-tz';

import { Reminder, Prisma, User } from '@prisma/client';
import { MessageService } from '../message/message.service';
import { DatabaseService } from '../database/database.service';
import { emojis, MAX_REMINDERS_PER_USER } from '../constants';
import { getNotificationTime } from '../utils';

const getNextIndex = (reminders: Reminder[]): number => {
  const lastEmoji = reminders[reminders.length - 1].emoji;
  const lastEmojiIndex = emojis.indexOf(lastEmoji);
  return lastEmojiIndex < 0 ? 0 : (lastEmojiIndex + 1) % emojis.length;
};

const getRandomEmojiIndex = (): number => {
  return Math.floor(Math.random() * emojis.length);
};

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly messageService: MessageService
  ) {}

  async create(user: User, data: Prisma.ReminderCreateInput): Promise<Reminder> {
    const currentReminders = await this.findAll(user.id);

    const currentUser: User = await this.db.user.findUnique({
      where: { id: user.id },
    });

    if (!currentUser) {
      throw new BadRequestException('User not found');
    }

    if (!currentUser.activeSubscription && currentReminders.length >= 1) {
      throw new BadRequestException(
        'Need an active subscription for more reminders'
      );
    }

    if (currentReminders.length >= MAX_REMINDERS_PER_USER) {
      throw new BadRequestException(
        `Maximum of ${MAX_REMINDERS_PER_USER} reminders allowed`
      );
    }

    const idx = currentReminders.length
      ? getNextIndex(currentReminders)
      : getRandomEmojiIndex();

    const notificationTime = getNotificationTime(new Date(data.notificationTime));

    this.logger.log(
      `Creating reminder for user ${user.id}: ${data.notificationTime} stored as ${notificationTime}, days: ${data.notificationDays}`
    );

    return this.db.reminder.create({
      data: {
        ...data,
        emoji: emojis[idx],
        notificationTime,
        user: {
          connect: { id: user.id },
        },
      },
    });
  }

  async findAll(userId: string): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder | null> {
    const reminder = await this.db.reminder.findUnique({ where });
    if (!reminder || reminder.userId !== userId) {
      return null;
    }
    return reminder;
  }

  async update({
    where,
    data,
    userId,
  }: {
    where: Prisma.ReminderWhereUniqueInput;
    data: Prisma.ReminderUpdateInput;
    userId: string;
  }): Promise<Reminder | null> {
    const reminder = await this.db.reminder.findUnique({ where });

    if (!reminder || reminder.userId !== userId) {
      this.logger.warn(`Unauthorized update attempt for reminder ${where.id}`);
      return null;
    }

    this.logger.log(
      `Updating reminder ${reminder.id} with ${JSON.stringify(data)}`
    );

    return this.db.reminder.update({ where, data });
  }

  async remove(
    where: Prisma.ReminderWhereUniqueInput,
    userId: string
  ): Promise<Reminder | null> {
    const reminder = await this.db.reminder.findUnique({ where });

    if (!reminder || reminder.userId !== userId) {
      this.logger.warn(`Unauthorized delete attempt for reminder ${where.id}`);
      return null;
    }

    // Delete associated messages first (no cascade in Prisma)
    try {
      const deletedMessages = await this.db.message.deleteMany({
        where: { reminderId: reminder.id },
      });
      this.logger.log(
        `Deleted ${deletedMessages.count} messages for reminder ${reminder.id}`
      );
    } catch (e) {
      this.logger.error(
        `Failed to delete messages for reminder ${reminder.id}: ${e.message}`
      );
    }

    this.logger.log(`Removing reminder ${reminder.id}`);

    return this.db.reminder.delete({
      where: { id: where.id },
    });
  }

  async getStats(userId: string): Promise<{
    total: number;
    active: number;
    completedToday: number;
  }> {
    const reminders = await this.findAll(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // This is simplified - in production you'd query completions
    return {
      total: reminders.length,
      active: reminders.filter((r) => r.isActive !== false).length,
      completedToday: 0,
    };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendReminders(): Promise<void> {
    const now = new Date();
    const notificationTime = getNotificationTime(now);

    this.logger.log(`Running reminder check at ${now.toISOString()}`);

    let remindersToSend = await this.db.reminder.findMany({
      where: { notificationTime },
    });

    // Filter by day of week in user's timezone
    remindersToSend = remindersToSend.filter((reminder) => {
      const userLocalNow = utcToZonedTime(now, reminder.timeZone);
      return reminder.notificationDays.includes(userLocalNow.getDay());
    });

    this.logger.log(`Found ${remindersToSend.length} reminders to send`);

    for (const reminder of remindersToSend) {
      try {
        this.logger.log(
          `Sending reminder ${reminder.emoji} ${reminder.id} at ${notificationTime}`
        );
        await this.messageService.create(reminder.id);
      } catch (error) {
        this.logger.error(
          `Failed to send reminder ${reminder.id}: ${error.message}`
        );
      }
    }
  }
}
