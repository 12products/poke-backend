import { Controller, Header, Post, Req } from '@nestjs/common'
import { Public } from 'src/auth/public.decorator'
import { MessageService } from './message.service'

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

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
}
