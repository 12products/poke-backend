import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'

export interface UserFromRequest {
  id: string
  phone?: string
  email?: string
  role?: string
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserFromRequest | undefined, context: ExecutionContext) => {
    const { user } = context.switchToHttp().getRequest()

    if (!user) {
      throw new UnauthorizedException('User not authenticated')
    }

    if (data) {
      return user[data]
    }

    return user
  }
)

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const { user } = context.switchToHttp().getRequest()

    if (!user?.id) {
      throw new UnauthorizedException('User not authenticated')
    }

    return user.id
  }
)

export const OptionalUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const { user } = context.switchToHttp().getRequest()
    return user || null
  }
)
