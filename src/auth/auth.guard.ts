// Authentication: proving you are who you say you are. Authorization: proving you're allowed to do what you're trying to do. Confusion: mixing up the two 🔐
import { Injectable, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

import { IS_PUBLIC_KEY } from './public.decorator'

// "You shall not pass!" - Gandalf, and also this guard to unauthorized users 🧙‍♂️
@Injectable()
export class PokeAuthGuard extends AuthGuard('supabase') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true // Come on in! The door's open! 🚪
    }

    // Sorry, members only. Do you have your ID? 🎫
    return super.canActivate(context)
  }
}
