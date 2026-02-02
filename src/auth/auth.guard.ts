import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'

import { IS_PUBLIC_KEY } from './public.decorator'

export const ROLES_KEY = 'roles'
export type UserRole = 'user' | 'admin' | 'moderator'

@Injectable()
export class PokeAuthGuard extends AuthGuard('supabase') {
  private readonly logger = new Logger(PokeAuthGuard.name)

  constructor(private reflector: Reflector) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      this.logger.debug('Public route accessed')
      return true
    }

    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader) {
      this.logger.warn('Missing authorization header')
      throw new UnauthorizedException('Authorization header is required')
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.warn('Invalid authorization header format')
      throw new UnauthorizedException('Invalid authorization header format')
    }

    try {
      const canActivate = await super.canActivate(context)

      if (canActivate) {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
          ROLES_KEY,
          [context.getHandler(), context.getClass()]
        )

        if (requiredRoles && requiredRoles.length > 0) {
          const user = request.user
          const userRole = user?.role || 'user'

          if (!requiredRoles.includes(userRole)) {
            this.logger.warn(
              `User ${user?.id} with role ${userRole} attempted to access route requiring ${requiredRoles.join(', ')}`
            )
            throw new UnauthorizedException('Insufficient permissions')
          }
        }

        this.logger.debug(`User ${request.user?.id} authenticated successfully`)
      }

      return canActivate as boolean
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`)
      throw new UnauthorizedException('Authentication failed')
    }
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.warn(`Auth request failed: ${info?.message || 'Unknown error'}`)
      throw err || new UnauthorizedException('Invalid or expired token')
    }
    return user
  }
}
