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
import { AuthGuard } from '@nestjs/passport'

import { RemindersService } from './reminders.service'
import { Prisma } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll() {
    return this.remindersService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.remindersService.findOne({ id })
  }

  @Post()
  create(
    @Body() data: Prisma.ReminderCreateInput,
    @CurrentUser() user: AuthUser
  ) {
    return this.remindersService.create(user, data)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.ReminderUpdateInput) {
    return this.remindersService.update({
      where: { id },
      data,
    })
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.remindersService.remove({ id })
  }
}
