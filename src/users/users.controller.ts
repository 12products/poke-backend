// A programmer's spouse says: "While you're at the store, get milk." They never returned. 🥛
import { Controller, Get, Body, Patch, Param } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { Prisma } from '@prisma/client'
import { UsersService } from './users.service'
import { CurrentUser } from '../auth/current-user.decorator'

// Why do programmers hate nature? It has too many bugs! 🐜
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('onboard')
  create(@CurrentUser() user: AuthUser) {
    // Welcome aboard! Please keep your arms and legs inside the ride at all times 🎢
    return this.usersService.onboard({ id: user.id, phone: user.phone })
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
    // Update: Now with 20% more user! (Terms and conditions may apply) 🔄
    return this.usersService.update({ where: { id }, data })
  }
}
