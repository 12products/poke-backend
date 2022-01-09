import { Get, Controller } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  healthCheck(): string {
    return 'OK'
  }
}
