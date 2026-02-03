// Root controller for the application
// Handles top-level routes that don't belong to a specific feature
import { Get, Controller } from '@nestjs/common'

// Import the Public decorator to bypass authentication
import { Public } from 'src/auth/public.decorator'

// Controller with no prefix - handles root routes
@Controller()
export class AppController {
  // Health check endpoint
  // This is used by load balancers and monitoring services
  // to verify the application is running
  @Public() // No auth required for health checks
  @Get() // GET /v1/
  healthCheck(): string {
    // Simple OK response - if this returns, the app is alive
    return 'OK'
  }
}
