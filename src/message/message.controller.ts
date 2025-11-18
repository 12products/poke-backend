import { Controller, Get, Header, Post, Req, Param } from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { Public } from 'src/auth/public.decorator'
import { MessageService } from './message.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { DatabaseService } from '../database/database.service'

@Controller('message')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly db: DatabaseService
  ) {}

  @Post()
  sendMessage(reminderId: string) {
    return this.messageService.sendMessage(reminderId)
  }

  @Public()
  @Post('sms')
  @Header('Content-Type', 'text/xml')
  receiveMessage(@Req() req) {
    return this.messageService.receiveMessage(req)
  }

  @Get()
  async getAllMessages(@CurrentUser() user: AuthUser) {
    // Get all messages for the user's reminders
    const messages = await this.db.message.findMany({
      where: {
        reminder: {
          userId: user.id,
        },
      },
      include: {
        reminder: {
          select: {
            id: true,
            text: true,
            emoji: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return messages
  }

  @Get('active')
  async getActiveMessages(@CurrentUser() user: AuthUser) {
    // Get only active messages
    const messages = await this.db.message.findMany({
      where: {
        reminder: {
          userId: user.id,
        },
        active: true,
      },
      include: {
        reminder: {
          select: {
            id: true,
            text: true,
            emoji: true,
          },
        },
      },
      orderBy: {
        nextSend: 'asc',
      },
    })
    return messages
  }

  @Get('reminder/:reminderId')
  async getMessageForReminder(
    @CurrentUser() user: AuthUser,
    @Param('reminderId') reminderId: string
  ) {
    // Verify the reminder belongs to the user
    const reminder = await this.db.reminder.findUnique({
      where: { id: reminderId },
    })

    if (!reminder || reminder.userId !== user.id) {
      return null
    }

    return this.messageService.findOne({ reminderId })
  }
}
