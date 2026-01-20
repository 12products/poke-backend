import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { TwilioService, TwilioStats } from './twilio.service'
import { Public } from '../auth/public.decorator'

interface VerifyPhoneDto {
  phone: string
}

@Controller('twilio')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Get('stats')
  getStats(): TwilioStats {
    return this.twilioService.getStats()
  }

  @Get('history')
  getMessageHistory(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10
    return this.twilioService.getMessageHistory(numLimit)
  }

  @Post('verify')
  async verifyPhone(
    @Body() body: VerifyPhoneDto
  ): Promise<{ valid: boolean }> {
    const valid = await this.twilioService.verifyPhoneNumber(body.phone)
    return { valid }
  }

  @Public()
  @Get('health')
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
    }
  }
}
