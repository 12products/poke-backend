// Current user decorator - who are you? Let's find out!
// Extracting user info like a detective, but legally
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

// This magical decorator pulls the user out of the request
// Like a rabbit out of a hat, but more useful
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    // Switching to HTTP context - it's like changing channels
    const { user } = context.switchToHttp().getRequest()
    return user // Here you go, one user, freshly extracted!
  }
)
