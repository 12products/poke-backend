import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  ForbiddenException,
} from '@nestjs/common'
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
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() data: Prisma.UserUpdateInput
  ) {
    if (user.id !== id) {
      throw new ForbiddenException('You can only update your own profile')
    }
    return this.usersService.update({ where: { id }, data })
  }
}
