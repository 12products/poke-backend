// Why do programmers always mix up Halloween and Christmas? Because Oct 31 == Dec 25 🎃🎄
import { Controller, Header, Post, Req } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'
import { MessageService } from './message.service'

// "Knock knock." "Who's there?" "...very long pause..." "Java." ☕
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  sendMessage(reminderId: string) {
    // Sending messages faster than my reply to "wyd" texts 📱
    return this.messageService.sendMessage(reminderId)
  }

  @Public()
  @Post('sms')
  @Header('Content-Type', 'text/xml')
  receiveMessage(@Req() req) {
    // Incoming! Duck for cover! 📨
    // Fun fact: SMS stands for "Short Message Service", not "So Many Strings"
    return this.messageService.receiveMessage(req)
  }
}
