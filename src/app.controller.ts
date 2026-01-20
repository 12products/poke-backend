// A SQL query walks into a bar, walks up to two tables and asks...
// "Can I join you?"

import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): string {
    return 'OK'
  }
}
