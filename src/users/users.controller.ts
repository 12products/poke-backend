// Users controller - handles HTTP requests for user operations
// Exposes REST endpoints for user management
import { Controller, Get, Body, Patch, Param } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

// Prisma types for request body typing
import { Prisma } from '@prisma/client'
import { UsersService } from './users.service'
// Decorator to extract current authenticated user
import { CurrentUser } from '../auth/current-user.decorator'

// Controller handles all routes under /users
@Controller('users')
export class UsersController {
  // Inject the users service for business logic
  constructor(private readonly usersService: UsersService) {}

  // GET /users/onboard - Initialize a new user in the system
  // This endpoint is called when a user first authenticates
  @Get('onboard')
  create(@CurrentUser() user: AuthUser) {
    // Pass user ID and phone from auth token to onboard service
    return this.usersService.onboard({ id: user.id, phone: user.phone })
  }

  // PATCH /users/:id - Update user information
  // Allows partial updates to user records
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
    // Delegate to service layer for actual update
    return this.usersService.update({ where: { id }, data })
  }
}
