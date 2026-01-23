import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): string {
    return 'OK'
  }

  @Public()
  @Get('version')
  getVersion(): { version: string; name: string } {
    return { version: '1.0.0', name: 'poke-backend' }
  }
}
