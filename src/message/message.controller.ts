import {
  Controller,
  Header,
  Post,
  Get,
  Req,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'
import { MessageService, MessageStats, MessageDeliveryResult } from './message.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { AuthUser } from '@supabase/supabase-js'

interface SendMessageDto {
  reminderId: string
}

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUser
  ): Promise<MessageDeliveryResult> {
    if (!dto.reminderId) {
      throw new BadRequestException('reminderId is required')
    }
    return this.messageService.sendMessage(dto.reminderId)
  }

  @Post('send/:reminderId')
  @HttpCode(HttpStatus.OK)
  async sendMessageByParam(
    @Param('reminderId') reminderId: string,
    @CurrentUser() user: AuthUser
  ): Promise<MessageDeliveryResult> {
    return this.messageService.sendMessage(reminderId)
  }

  @Get('active')
  async getActiveMessages(@CurrentUser() user: AuthUser) {
    return this.messageService.findAllActive()
  }

  @Get('stats')
  async getMessageStats(@CurrentUser() user: AuthUser): Promise<MessageStats> {
    return this.messageService.getMessageStats()
  }

  @Get(':reminderId')
  async getMessageByReminder(
    @Param('reminderId') reminderId: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.messageService.findByReminderId(reminderId)
  }

  @Public()
  @Post('sms')
  @Header('Content-Type', 'text/xml')
  async receiveMessage(@Req() req): Promise<string> {
    return this.messageService.receiveMessage(req)
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  async triggerCleanup(@CurrentUser() user: AuthUser): Promise<{ deactivated: number }> {
    const count = await this.messageService.deactivateExpiredMessages()
    return { deactivated: count }
  }
}
