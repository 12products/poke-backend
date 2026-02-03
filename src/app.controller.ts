// The app controller - keeping it simple since 2023
// Less is more, they say
import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

@Controller()
export class AppController {
  @Public()
  @Get()
  // If this returns OK, we're good. If not, panic!
  healthCheck(): string {
    // Two letters that bring so much joy
    return 'OK'
  }
}
