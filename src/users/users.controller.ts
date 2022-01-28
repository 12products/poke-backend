import { Controller, Get, Body, Patch, Param } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { Prisma } from '@prisma/client'
import { UsersService } from './users.service'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('onboard')
  create(@CurrentUser() user: AuthUser) {
    return this.usersService.onboard({ id: user.id, phone: user.phone })
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
    return this.usersService.update({ where: { id }, data })
  }
}
