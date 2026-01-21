import {
  Controller,
  Header,
  Post,
  Req,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { AuthUser } from '@supabase/supabase-js'

import { Public } from 'src/auth/public.decorator'
import { MessageService, MessageStats } from './message.service'
import { CurrentUser } from '../auth/current-user.decorator'

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('stats')
  getStats(): Promise<MessageStats> {
    return this.messageService.getMessageStats()
  }

  @Get('active')
  getActiveMessages() {
    return this.messageService.getActiveMessages()
  }

  @Post()
  sendMessage(reminderId: string) {
    return this.messageService.sendMessage(reminderId)
  }

  @Post(':reminderId/cancel')
  @HttpCode(HttpStatus.OK)
  cancelMessage(
    @Param('reminderId') reminderId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.messageService.cancelMessage(reminderId, user.id)
  }

  @Post(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  acknowledgeMessage(@Param('id') id: string) {
    return this.messageService.acknowledgeMessage(id)
  }

  @Public()
  @Post('sms')
  @Header('Content-Type', 'text/xml')
  receiveMessage(@Req() req) {
    return this.messageService.receiveMessage(req)
  }
}
