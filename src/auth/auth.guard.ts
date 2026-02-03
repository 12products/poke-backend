// The auth guard - protecting your endpoints since day one
// Like a bouncer, but for APIs
import { Injectable, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

import { IS_PUBLIC_KEY } from './public.decorator'

@Injectable()
export class PokeAuthGuard extends AuthGuard('supabase') {
  constructor(private reflector: Reflector) {
    super()
  }

  // Can you pass? Let me check my list...
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // VIP access - no questions asked
    if (isPublic) {
      return true // Welcome, friend!
    }

    return super.canActivate(context)
  }
}
