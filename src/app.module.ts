import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RemindersModule } from './reminders/reminders.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RemindersModule,
    UsersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
