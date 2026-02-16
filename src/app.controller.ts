import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'
import { APP_VERSION } from './constants'

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): Record<string, string> {
    return {
      status: 'OK',
      version: APP_VERSION,
    }
  }
}
