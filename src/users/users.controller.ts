import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { Prisma } from '@prisma/client'
import { UsersService, UserStats } from './users.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { Public } from '../auth/public.decorator'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('onboard')
  create(@CurrentUser() user: AuthUser) {
    return this.usersService.onboard({ id: user.id, phone: user.phone })
  }

  @Get('me')
  getCurrentUser(@CurrentUser() user: AuthUser) {
    return this.usersService.findOneOrFail({ id: user.id })
  }

  @Get('me/stats')
  getCurrentUserStats(@CurrentUser() user: AuthUser): Promise<UserStats> {
    return this.usersService.getUserStats(user.id)
  }

  @Get('me/reminders')
  getCurrentUserWithReminders(@CurrentUser() user: AuthUser) {
    return this.usersService.findWithReminders(user.id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
    return this.usersService.update({ where: { id }, data })
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCurrentUser(@CurrentUser() user: AuthUser): Promise<void> {
    await this.usersService.remove({ id: user.id })
  }

  @Public()
  @Get('count')
  async getUserCount(): Promise<{ count: number }> {
    const count = await this.usersService.countUsers()
    return { count }
  }

  @Get('search')
  searchUsers(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return []
    }
    return this.usersService.searchUsers(query)
  }
}
