import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { CreateReminderDto, UpdateReminderDto } from './dto';

const REMINDERS_TABLE = 'reminders';

@Injectable()
export class RemindersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createReminderDto: CreateReminderDto) {
    const { data, error } = await this.databaseService.client
      .from('reminders')
      .insert([createReminderDto]);

    if (error) {
      throw new Error(`Failed to create reminder: ${JSON.stringify(error)}`);
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.databaseService.client
      .from(REMINDERS_TABLE)
      .select();

    if (error) {
      throw new Error(`Failed to fetch reminders: ${JSON.stringify(error)}`);
    }

    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.databaseService.client
      .from(REMINDERS_TABLE)
      .select()
      .match({ id });

    if (error) {
      throw new Error(
        `Failed to fetch reminder by ID (${id}): ${JSON.stringify(error)}`,
      );
    }

    return data[0] || null;
  }

  async update(id: number, updateReminderDto: UpdateReminderDto) {
    const { data, error } = await this.databaseService.client
      .from(REMINDERS_TABLE)
      .update(updateReminderDto)
      .match({ id });

    if (error) {
      throw new Error(
        `Failed to update reminder by ID (${id}): ${JSON.stringify(error)}`,
      );
    }

    return data;
  }

  async remove(id: number) {
    const { data, error } = await this.databaseService.client
      .from(REMINDERS_TABLE)
      .delete()
      .match({ id });

    if (error) {
      throw new Error(
        `Failed to delete reminder by ID (${id}): ${JSON.stringify(error)}`,
      );
    }

    return data;
  }
}
