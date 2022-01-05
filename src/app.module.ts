import { Module } from '@nestjs/common';
import { RemindersModule } from './reminders/reminders.module';
import { AppController } from './app.controller';

@Module({
  imports: [RemindersModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
