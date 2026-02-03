// Root application controller
// Handles base-level routes for the API
import { Get, Controller } from '@nestjs/common'

// Import the Public decorator to bypass auth
import { Public } from 'src/auth/public.decorator'

// Controller decorator with empty path - handles root routes
@Controller()
export class AppController {
  // Health check endpoint
  // Marked as public so it can be accessed without authentication
  // Useful for load balancers and monitoring systems
  @Public()
  @Get()
  healthCheck(): string {
    // Return simple OK response to indicate service is running
    return 'OK'
  }
}
