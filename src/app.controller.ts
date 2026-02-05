// Doctor: "Your server is healthy!" Me: "Great! What about the code?" Doctor: "...let's focus on the good news" 🏥
import { Get, Controller } from '@nestjs/common'

import { Public } from 'src/auth/public.decorator'

@Controller()
export class AppController {
  @Public()
  @Get()
  healthCheck(): string {
    // I'm OK, you're OK. Everything is OK. (Until it's not) ✅
    return 'OK'
  }
}
