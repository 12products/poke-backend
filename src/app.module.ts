import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RemindersModule } from './reminders/reminders.module';
import { AppController } from './app.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RemindersModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
