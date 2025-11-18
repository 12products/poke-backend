import { Module } from '@nestjs/common'
import { DemoController } from './demo.controller'
import { DemoService } from './demo.service'
import { DatabaseModule } from '../database/database.module'
import { MessageModule } from '../message/message.module'

@Module({
  imports: [DatabaseModule, MessageModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
