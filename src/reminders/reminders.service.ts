import { Injectable } from '@nestjs/common';

import { Reminder, Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RemindersService {
  constructor(private readonly db: DatabaseService) {}

  async create(data: Prisma.ReminderCreateInput): Promise<Reminder> {
    return this.db.reminder.create({ data });
  }

  async findAll(): Promise<Reminder[]> {
    return this.db.reminder.findMany();
  }

  async findOne(
    where: Prisma.ReminderWhereUniqueInput,
  ): Promise<Reminder | null> {
    return this.db.reminder.findUnique({ where });
  }

  async update({
    where,
    data,
  }: {
    where: Prisma.ReminderWhereUniqueInput;
    data: Prisma.ReminderUpdateInput;
  }): Promise<Reminder> {
    return this.db.reminder.update({ where, data });
  }

  async remove(where: Prisma.ReminderWhereUniqueInput): Promise<Reminder> {
    return this.db.reminder.delete({ where });
  }
}
