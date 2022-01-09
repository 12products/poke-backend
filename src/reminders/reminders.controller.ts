import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { RemindersService } from './reminders.service';
import { Prisma } from '@prisma/client';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  findAll() {
    return this.remindersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.remindersService.findOne({ id: id });
  }

  @Post()
  create(@Body() data: Prisma.ReminderCreateInput) {
    return this.remindersService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.ReminderUpdateInput) {
    return this.remindersService.update({
      where: { id: id },
      data,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.remindersService.remove({ id: id });
  }
}
