// Reminders Controller
// Handles HTTP requests for reminder CRUD operations
// All routes are protected by authentication
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
import { CurrentUser } from '../auth/current-user.decorator' // Custom decorator to get authenticated user

// Routes prefixed with /v1/reminders
@Controller('reminders')
export class RemindersController {
  // Inject the reminders service via constructor
  constructor(private readonly remindersService: RemindersService) {}

  // GET /v1/reminders
  // Returns all reminders for the authenticated user
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    // Only return reminders belonging to this user
    return this.remindersService.findAll(user.id)
  }

  // GET /v1/reminders/:id
  // Returns a specific reminder by ID
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    // Make sure user can only access their own reminders
    return this.remindersService.findOne({ id }, user.id)
  }

  // POST /v1/reminders
  // Creates a new reminder
  @Post()
  create(
    @Body() data: Prisma.ReminderCreateInput,
    @CurrentUser() user: AuthUser
  ) {
    // Pass user context for ownership assignment
    return this.remindersService.create(user, data)
  }

  // PATCH /v1/reminders/:id
  // Updates an existing reminder
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() data: Prisma.ReminderUpdateInput
  ) {
    // Update reminder with ownership verification
    return this.remindersService.update({
      where: { id },
      data,
      userId: user.id, // For authorization check
    })
  }

  // DELETE /v1/reminders/:id
  // Deletes a reminder
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    // Remove reminder (also cascades to delete associated messages)
    return this.remindersService.remove({ id }, user.id)
  }
}
