// Users Controller
// Handles HTTP requests for user management operations
// Used for onboarding new users and updating user profiles
import { Controller, Get, Body, Patch, Param } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { Prisma } from '@prisma/client'
import { UsersService } from './users.service'
import { CurrentUser } from '../auth/current-user.decorator'

// Routes prefixed with /v1/users
@Controller('users')
export class UsersController {
  // Inject the users service
  constructor(private readonly usersService: UsersService) {}

  // GET /v1/users/onboard
  // Called when a new user signs up to create their database record
  // Idempotent - safe to call multiple times
  @Get('onboard')
  create(@CurrentUser() user: AuthUser) {
    // Extract user ID and phone from Supabase auth
    // This creates or retrieves the user record
    return this.usersService.onboard({ id: user.id, phone: user.phone })
  }

  // PATCH /v1/users/:id
  // Update user profile information
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
    // Update the user with the provided data
    return this.usersService.update({ where: { id }, data })
  }
}
