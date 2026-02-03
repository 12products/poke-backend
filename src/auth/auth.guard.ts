// Authentication Guard
// This guard protects all routes by default
// It checks for valid Supabase JWT tokens
import { Injectable, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core' // For reading metadata
import { AuthGuard } from '@nestjs/passport'

// Import the key used to mark routes as public
import { IS_PUBLIC_KEY } from './public.decorator'

// The main authentication guard for the Poke application
// Extends Passport's AuthGuard with our 'supabase' strategy
@Injectable()
export class PokeAuthGuard extends AuthGuard('supabase') {
  // Reflector allows us to read metadata from route handlers
  constructor(private reflector: Reflector) {
    super() // Call parent constructor
  }

  // This method is called for every request to check if it's allowed
  canActivate(context: ExecutionContext) {
    // Check if the route or controller is marked as @Public()
    // getAllAndOverride checks both handler and class level decorators
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Check method-level decorator
      context.getClass(), // Check class-level decorator
    ])

    // If the route is public, allow access without authentication
    if (isPublic) {
      return true
    }

    // Otherwise, use the parent class auth logic (validates JWT)
    return super.canActivate(context)
  }
}
