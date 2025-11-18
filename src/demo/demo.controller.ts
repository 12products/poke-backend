import { Controller, Get, Post, Param, Body } from '@nestjs/common'
import { DemoService } from './demo.service'
import { Public } from '../auth/public.decorator'

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Public()
  @Get('info')
  async getDemoInfo() {
    return this.demoService.getDemoInfo()
  }

  @Public()
  @Get('users')
  async getDemoUsers() {
    return this.demoService.getDemoUsers()
  }

  @Public()
  @Get('reminders')
  async getAllReminders() {
    return this.demoService.getAllReminders()
  }

  @Public()
  @Get('users/:phone/reminders')
  async getUserReminders(@Param('phone') phone: string) {
    return this.demoService.getUserReminders(phone)
  }

  @Public()
  @Post('send-reminder/:reminderId')
  async triggerReminder(@Param('reminderId') reminderId: string) {
    return this.demoService.triggerReminder(reminderId)
  }

  @Public()
  @Post('simulate-response')
  async simulateResponse(
    @Body() data: { phone: string; emoji: string }
  ) {
    return this.demoService.simulateUserResponse(data.phone, data.emoji)
  }

  @Public()
  @Get('stats')
  async getDemoStats() {
    return this.demoService.getStats()
  }
}
