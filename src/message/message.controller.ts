import {
  Controller,
  Header,
  Post,
  Req,
  Patch,
  Param,
  Body,
  Delete,
  Get,
} from '@nestjs/common'
import { MessageService } from './message.service'
import { Prisma } from '@prisma/client'

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  findAll() {
    return this.messageService.findAll()
  }

  @Post()
  sendMessage(reminderId: string) {
    return this.messageService.sendMessage(reminderId)
  }

  @Post('sms')
  @Header('Content-Type', 'text/xml')
  receiveMessage(@Req() req) {
    return this.messageService.receiveMessage(req)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.MessageUpdateInput) {
    return this.messageService.update({
      where: { id },
      data,
    })
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageService.remove({ id })
  }
}
