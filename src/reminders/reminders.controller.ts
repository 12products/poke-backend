// "I'll do it later" - Famous last words of every developer with a reminder app 📅
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
import { Prisma } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'

// REST API: GET some reminders, POST your dreams, PATCH things up, DELETE your worries 😌
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    // Finding all reminders... Like finding all your TODO comments before a code review 😰
    return this.remindersService.findAll(user.id)
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    // Looking for one specific reminder in a sea of procrastination 🔍
    return this.remindersService.findOne({ id }, user.id)
  }

  @Post()
  create(
    @Body() data: Prisma.ReminderCreateInput,
    @CurrentUser() user: AuthUser
  ) {
    // Creating a reminder to create reminders. Meta! 🤯
    return this.remindersService.create(user, data)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() data: Prisma.ReminderUpdateInput
  ) {
    // Updating reminders: because even reminders need second chances ✏️
    return this.remindersService.update({
      where: { id },
      data,
      userId: user.id,
    })
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    // Deleting reminders: the digital equivalent of "I got this!" (Narrator: They did not, in fact, have this) 🗑️
    return this.remindersService.remove({ id }, user.id)
  }
}
