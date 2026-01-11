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
} from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { RemindersService, ReminderStats } from './reminders.service'
import { Prisma, Reminder } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'

interface BulkActionResponse {
  success: boolean
  count: number
  message: string
}

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser): Promise<Reminder[]> {
    return this.remindersService.findAll(user.id)
  }

  @Get('stats')
  getStats(@CurrentUser() user: AuthUser): Promise<ReminderStats> {
    return this.remindersService.getStats(user.id)
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<Reminder> {
    return this.remindersService.findOne({ id }, user.id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() data: Prisma.ReminderCreateInput,
    @CurrentUser() user: AuthUser
  ): Promise<Reminder> {
    return this.remindersService.create(user, data)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() data: Prisma.ReminderUpdateInput
  ): Promise<Reminder> {
    return this.remindersService.update({
      where: { id },
      data,
      userId: user.id,
    })
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  pause(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<Reminder> {
    return this.remindersService.pause(id, user.id)
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  resume(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<Reminder> {
    return this.remindersService.resume(id, user.id)
  }

  @Post('bulk/pause')
  @HttpCode(HttpStatus.OK)
  async bulkPause(@CurrentUser() user: AuthUser): Promise<BulkActionResponse> {
    const count = await this.remindersService.bulkPause(user.id)
    return {
      success: true,
      count,
      message: `Paused ${count} reminders`,
    }
  }

  @Post('bulk/resume')
  @HttpCode(HttpStatus.OK)
  async bulkResume(@CurrentUser() user: AuthUser): Promise<BulkActionResponse> {
    const count = await this.remindersService.bulkResume(user.id)
    return {
      success: true,
      count,
      message: `Resumed ${count} reminders`,
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<Reminder> {
    return this.remindersService.remove({ id }, user.id)
  }
}
