import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SKIP_THROTTLE_KEY } from '../../auth/public.decorator'

interface ThrottleRecord {
  count: number
  resetTime: number
}

@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly store = new Map<string, ThrottleRecord>()
  private readonly ttl: number
  private readonly limit: number

  constructor(private reflector: Reflector) {
    this.ttl = parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000
    this.limit = parseInt(process.env.THROTTLE_LIMIT || '100', 10)
  }

  canActivate(context: ExecutionContext): boolean {
    const skipThrottle = this.reflector.getAllAndOverride<boolean>(
      SKIP_THROTTLE_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (skipThrottle) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const key = this.generateKey(request)
    const now = Date.now()

    const record = this.store.get(key)

    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.ttl,
      })
      return true
    }

    if (record.count >= this.limit) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      )
    }

    record.count++
    return true
  }

  private generateKey(request: any): string {
    const userId = request.user?.id
    const ip = request.ip || request.connection?.remoteAddress

    if (userId) {
      return `user:${userId}`
    }

    return `ip:${ip}`
  }

  clearStore(): void {
    this.store.clear()
  }

  getStoreSize(): number {
    return this.store.size
  }
}

@Injectable()
export class IpThrottleGuard implements CanActivate {
  private readonly ipStore = new Map<string, ThrottleRecord>()
  private readonly maxRequestsPerMinute = 60

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const ip = request.ip || request.connection?.remoteAddress
    const now = Date.now()
    const windowMs = 60 * 1000

    const record = this.ipStore.get(ip)

    if (!record || now > record.resetTime) {
      this.ipStore.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      })
      return true
    }

    if (record.count >= this.maxRequestsPerMinute) {
      throw new HttpException(
        'Too many requests from this IP',
        HttpStatus.TOO_MANY_REQUESTS
      )
    }

    record.count++
    return true
  }
}
