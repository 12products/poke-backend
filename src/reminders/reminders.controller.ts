import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { RemindersService } from './reminders.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { CreateReminderDto, UpdateReminderDto } from './dto'

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.remindersService.findAll(user.id)
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.remindersService.findOne({ id }, user.id)
  }

  @Post()
  create(@Body() data: CreateReminderDto, @CurrentUser() user: AuthUser) {
    return this.remindersService.create(user, data)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() data: UpdateReminderDto
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
