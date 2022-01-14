import { Module } from '@nestjs/common'
import { TwilioController } from './twilio.controller'
import { TwilioService } from './twilio.service'

@Module({
  controllers: [TwilioController],
  providers: [TwilioService],
  exports: [TwilioService],
})
export class TwilioModule {}
