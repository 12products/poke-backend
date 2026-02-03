// Current user decorator - extracts authenticated user from request
// Provides a clean way to access the user in controller methods
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

// Parameter decorator that extracts the user from the request
// The user is attached to the request by the Supabase auth strategy
// Usage: @CurrentUser() user: AuthUser in controller parameters
export const CurrentUser = createParamDecorator(
  // _data parameter is unused but required by createParamDecorator signature
  (_data: unknown, context: ExecutionContext) => {
    // Get the HTTP request from the execution context
    const { user } = context.switchToHttp().getRequest()
    // Return the user object attached by passport
    return user
  }
)
