// Custom authentication guard for the Poke application
// Extends the Passport AuthGuard with public route support
import { Injectable, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

// Import the public key constant for decorator metadata
import { IS_PUBLIC_KEY } from './public.decorator'

// Injectable guard that uses the 'supabase' passport strategy
@Injectable()
export class PokeAuthGuard extends AuthGuard('supabase') {
  // Reflector is used to read metadata from decorators
  constructor(private reflector: Reflector) {
    super()
  }

  // Determine if the current request is allowed to proceed
  // This method is called for every incoming request
  canActivate(context: ExecutionContext) {
    // Check if the route is marked as public using the @Public() decorator
    // This checks both the handler (method) and the class (controller)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If route is public, allow access without authentication
    if (isPublic) {
      return true
    }

    // Otherwise, delegate to the parent AuthGuard for JWT validation
    return super.canActivate(context)
  }
}
