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

import { RemindersService, ReminderStats, ReminderSummary } from './reminders.service'
import { Prisma } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.remindersService.findAll(user.id)
  }

  @Get('stats')
  getStats(@CurrentUser() user: AuthUser): Promise<ReminderStats> {
    return this.remindersService.getStats(user.id)
  }

  @Get('summary')
  getSummary(@CurrentUser() user: AuthUser): Promise<ReminderSummary[]> {
    return this.remindersService.getSummary(user.id)
  }

  @Get('count')
  async getCount(@CurrentUser() user: AuthUser): Promise<{ count: number }> {
    const count = await this.remindersService.countByUser(user.id)
    return { count }
  }

  @Get('can-create')
  async canCreate(
    @CurrentUser() user: AuthUser
  ): Promise<{ allowed: boolean }> {
    const allowed = await this.remindersService.validateReminderLimit(user.id)
    return { allowed }
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.remindersService.findOne({ id }, user.id)
  }

  @Post()
  create(
    @Body() data: Prisma.ReminderCreateInput,
    @CurrentUser() user: AuthUser
  ) {
    return this.remindersService.create(user, data)
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.remindersService.duplicateReminder(id, user.id)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() data: Prisma.ReminderUpdateInput
  ) {
    return this.remindersService.update({
      where: { id },
      data,
      userId: user.id,
    })
  }

  @Patch('bulk/days')
  async bulkUpdateDays(
    @CurrentUser() user: AuthUser,
    @Body() body: { reminderIds: string[]; days: number[] }
  ): Promise<{ updated: number }> {
    const count = await this.remindersService.bulkUpdateDays(
      user.id,
      body.reminderIds,
      body.days
    )
    return { updated: count }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.remindersService.remove({ id }, user.id)
  }
}
