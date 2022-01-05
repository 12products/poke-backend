import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

import { CreateReminderDto, UpdateReminderDto } from './dto';

const REMINDERS_TABLE = 'reminders';

@Injectable()
export class RemindersService {
  private db = null;

  constructor(private readonly configService: ConfigService) {
    this.db = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_KEY'),
    );
  }

  async create(createReminderDto: CreateReminderDto) {
    const { data, error } = await this.db
      .from('reminders')
      .insert([createReminderDto]);

    if (error) {
      throw new Error(`Failed to create reminder: ${error}`);
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.db.from(REMINDERS_TABLE).select();

    if (error) {
      throw new Error(`Failed to fetch reminders: ${error}`);
    }

    return data;
  }

  async findOne(id: number) {
    const { data, error } = await this.db
      .from(REMINDERS_TABLE)
      .select()
      .match({ id })
      .limit(1)
      .single();

    if (error) {
      throw new Error(`Failed to fetch reminder by ID (${id}): ${error}`);
    }

    return data;
  }

  async update(id: number, updateReminderDto: UpdateReminderDto) {
    const { data, error } = await this.db
      .from(REMINDERS_TABLE)
      .update(updateReminderDto)
      .match({ id });

    if (error) {
      throw new Error(`Failed to update reminder by ID (${id}): ${error}`);
    }

    return data;
  }

  async remove(id: number) {
    const { data, error } = await this.db
      .from(REMINDERS_TABLE)
      .delete()
      .match({ id });

    if (error) {
      throw new Error(`Failed to delete reminder by ID (${id}): ${error}`);
    }

    return data;
  }
}
