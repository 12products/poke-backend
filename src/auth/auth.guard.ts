import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

import { IS_PUBLIC_KEY } from './public.decorator'

@Injectable()
export class PokeAuthGuard extends AuthGuard('supabase') {
  private readonly logger = new Logger(PokeAuthGuard.name)

  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      this.logger.debug('Allowing public route access')
      return true
    }

    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers?.authorization

    if (!authHeader) {
      this.logger.warn('No authorization header present')
      throw new UnauthorizedException('No authorization header provided')
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.warn('Invalid authorization header format')
      throw new UnauthorizedException('Invalid authorization header format')
    }

    return super.canActivate(context)
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest()
      const path = request.url
      this.logger.warn(`Authentication failed for path: ${path}`)

      if (info?.message) {
        this.logger.debug(`Auth info: ${info.message}`)
      }

      throw err || new UnauthorizedException('Invalid or expired token')
    }

    this.logger.debug(`User authenticated: ${user.id}`)
    return user
  }
}
