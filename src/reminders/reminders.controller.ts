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

import { RemindersService } from './reminders.service'
import { Prisma } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { BulkDeleteDto } from './dto/bulk-delete.dto'
import { DatabaseService } from '../database/database.service'
import { StatisticsService } from '../users/statistics.service'

@Controller('reminders')
export class RemindersController {
  constructor(
    private readonly remindersService: RemindersService,
    private readonly db: DatabaseService,
    private readonly statisticsService: StatisticsService
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.remindersService.findAll(user.id)
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.remindersService.findOne({ id }, user.id)
  }

  @Get(':id/statistics')
  async getReminderStatistics(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string
  ) {
    return this.statisticsService.getReminderStatistics(id, user.id)
  }

  @Post()
  create(
    @Body() data: Prisma.ReminderCreateInput,
    @CurrentUser() user: AuthUser
  ) {
    return this.remindersService.create(user, data)
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(
    @CurrentUser() user: AuthUser,
    @Body() bulkDeleteDto: BulkDeleteDto
  ) {
    const results = []
    for (const id of bulkDeleteDto.reminderIds) {
      try {
        const result = await this.remindersService.remove({ id }, user.id)
        results.push({ id, success: true, reminder: result })
      } catch (error) {
        results.push({ id, success: false, error: error.message })
      }
    }
    return {
      total: bulkDeleteDto.reminderIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async markComplete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    // Verify the reminder belongs to the user
    const reminder = await this.remindersService.findOne({ id }, user.id)
    if (!reminder) {
      return { success: false, message: 'Reminder not found' }
    }

    // Delete the associated message to mark it as complete
    try {
      await this.db.message.deleteMany({
        where: { reminderId: id },
      })
      return { success: true, message: 'Reminder marked as complete' }
    } catch (error) {
      return { success: false, message: error.message }
    }
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

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.remindersService.remove({ id }, user.id)
  }
}
