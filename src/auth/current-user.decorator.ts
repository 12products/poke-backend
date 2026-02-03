// Current User Decorator
// Custom parameter decorator to extract the authenticated user from the request
// This makes it easy to access the user in controller methods
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

// Create a custom parameter decorator
// This can be used like: @CurrentUser() user: AuthUser
export const CurrentUser = createParamDecorator(
  // _data is unused but required by the signature
  // context gives us access to the request
  (_data: unknown, context: ExecutionContext) => {
    // Switch to HTTP context and get the request object
    const { user } = context.switchToHttp().getRequest()
    // Return the user object (populated by Passport after JWT validation)
    // This will be the Supabase AuthUser containing id, email, phone, etc.
    return user
  }
)

// Usage in controllers:
// @Get()
// findAll(@CurrentUser() user: AuthUser) {
//   return this.service.findAll(user.id)
// }
