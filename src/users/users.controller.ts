import { Controller, Get, Body, Patch, Param } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { Prisma } from '@prisma/client'
import { UsersService } from './users.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { StatisticsService } from './statistics.service'

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly statisticsService: StatisticsService
  ) {}

  @Get('onboard')
  create(@CurrentUser() user: AuthUser) {
    return this.usersService.onboard({ id: user.id, phone: user.phone })
  }

  @Get('me')
  getCurrentUser(@CurrentUser() user: AuthUser) {
    return this.usersService.findOne({ id: user.id })
  }

  @Get('statistics')
  getStatistics(@CurrentUser() user: AuthUser) {
    return this.statisticsService.getUserStatistics(user.id)
  }

  @Get('activity')
  getActivity(@CurrentUser() user: AuthUser) {
    return this.statisticsService.getActivityByDay(user.id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
    return this.usersService.update({ where: { id }, data })
  }
}
