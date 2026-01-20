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

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    )

    // If roles are specified, we'll check them after authentication
    if (requiredRoles) {
      this.logger.debug(`Route requires roles: ${requiredRoles.join(', ')}`)
    }

    return super.canActivate(context)
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      this.logger.warn(
        `Authentication failed: ${err?.message || info?.message || 'Unknown error'}`
      )
      throw err || new UnauthorizedException('Authentication required')
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = user.role || 'user'
      if (!requiredRoles.includes(userRole)) {
        this.logger.warn(
          `User ${user.id} with role ${userRole} denied access to route requiring ${requiredRoles.join(', ')}`
        )
        throw new UnauthorizedException('Insufficient permissions')
      }
    }

    return user
  }
}

// Decorator for requiring specific roles
export const Roles = (...roles: UserRole[]) => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value || target)
  }
}
