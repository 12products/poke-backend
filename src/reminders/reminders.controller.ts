// Reminders controller - REST API for reminder management
// Provides full CRUD operations for user reminders
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
// Supabase user type for authentication
import { AuthUser } from '@supabase/supabase-js'

import { RemindersService } from './reminders.service'
// Prisma types for request body typing
import { Prisma } from '@prisma/client'
// Custom decorator to extract authenticated user
import { CurrentUser } from '../auth/current-user.decorator'

// Controller handles all /reminders routes
@Controller('reminders')
export class RemindersController {
  // Inject the reminders service
  constructor(private readonly remindersService: RemindersService) {}

  // GET /reminders - List all reminders for current user
  // Returns array of reminder objects
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    // Pass user ID to service to filter reminders
    return this.remindersService.findAll(user.id)
  }

  // GET /reminders/:id - Get a specific reminder by ID
  // Returns single reminder or null if not found/not owned
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    // Service will verify ownership
    return this.remindersService.findOne({ id }, user.id)
  }

  // POST /reminders - Create a new reminder
  // Request body should contain reminder data
  @Post()
  create(
    @Body() data: Prisma.ReminderCreateInput,
    @CurrentUser() user: AuthUser
  ) {
    // Create reminder linked to current user
    return this.remindersService.create(user, data)
  }

  // PATCH /reminders/:id - Update an existing reminder
  // Allows partial updates to reminder properties
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() data: Prisma.ReminderUpdateInput
  ) {
    // Service handles ownership verification
    return this.remindersService.update({
      where: { id },
      data,
      userId: user.id,
    })
  }

  // DELETE /reminders/:id - Delete a reminder
  // Also cleans up associated messages
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    // Service handles ownership verification and cleanup
    return this.remindersService.remove({ id }, user.id)
  }
}
