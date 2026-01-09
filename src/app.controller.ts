import { Get, Controller } from '@nestjs/common';

import { Public } from 'src/auth/public.decorator';
import { APP_NAME, APP_VERSION } from './constants';
import { getRandomEmoji, getRandomMotivation } from './utils';

interface HealthResponse {
  status: string;
  app: string;
  version: string;
  timestamp: string;
}

interface MotivationResponse {
  message: string;
  emoji: string;
}

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): string {
    return 'OK';
  }

  @Public()
  @Get('health')
  detailedHealth(): HealthResponse {
    return {
      status: 'healthy',
      app: APP_NAME,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('motivation')
  getMotivation(): MotivationResponse {
    return {
      message: getRandomMotivation(),
      emoji: getRandomEmoji(),
    };
  }

  @Public()
  @Get('ping')
  ping(): string {
    return 'pong';
  }
}
