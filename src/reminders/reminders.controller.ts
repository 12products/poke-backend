import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { RemindersService, ReminderStats, ReminderWithStatus } from './reminders.service'
import { Prisma, Reminder } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'

interface CreateReminderDto {
  text: string
  notificationTime: string
  notificationDays: number[]
  timeZone?: string
}

interface UpdateReminderDto {
  text?: string
  notificationTime?: string
  notificationDays?: number[]
  timeZone?: string
}

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser): Promise<Reminder[]> {
    return this.remindersService.findAll(user.id)
  }

  @Get('with-status')
  findAllWithStatus(@CurrentUser() user: AuthUser): Promise<ReminderWithStatus[]> {
    return this.remindersService.findAllWithStatus(user.id)
  }

  @Get('stats')
  getStats(@CurrentUser() user: AuthUser): Promise<ReminderStats> {
    return this.remindersService.getStats(user.id)
  }

  @Get('count')
  async getCount(@CurrentUser() user: AuthUser): Promise<{ count: number }> {
    const count = await this.remindersService.countByUser(user.id)
    return { count }
  }

  @Get('by-emoji/:emoji')
  findByEmoji(
    @CurrentUser() user: AuthUser,
    @Param('emoji') emoji: string
  ): Promise<Reminder | null> {
    return this.remindersService.findByEmoji(user.id, decodeURIComponent(emoji))
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string
  ): Promise<Reminder> {
    return this.remindersService.findOneOrFail({ id }, user.id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() data: CreateReminderDto,
    @CurrentUser() user: AuthUser
  ): Promise<Reminder> {
    return this.remindersService.create(user, {
      text: data.text,
      notificationTime: data.notificationTime,
      notificationDays: data.notificationDays,
      timeZone: data.timeZone || 'America/New_York',
    })
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  duplicate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string
  ): Promise<Reminder> {
    return this.remindersService.duplicateReminder(id, user.id)
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  pause(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string
  ): Promise<Reminder> {
    return this.remindersService.pauseReminder(id, user.id)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() data: UpdateReminderDto
  ): Promise<Reminder> {
    return this.remindersService.update({
      where: { id },
      data: data as Prisma.ReminderUpdateInput,
      userId: user.id,
    })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string
  ): Promise<void> {
    await this.remindersService.remove({ id }, user.id)
  }
}
