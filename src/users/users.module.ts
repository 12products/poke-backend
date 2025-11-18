import { Module } from '@nestjs/common'

import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { DatabaseModule } from '../database/database.module'
import { StatisticsService } from './statistics.service'

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, StatisticsService],
  exports: [UsersService, StatisticsService],
})
export class UsersModule {}
