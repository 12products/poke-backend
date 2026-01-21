import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, ip } = request
    const userAgent = request.get('user-agent') || ''
    const userId = request.user?.id || 'anonymous'

    const now = Date.now()

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse()
          const { statusCode } = response
          const contentLength = response.get('content-length') || 0
          const duration = Date.now() - now

          this.logger.log(
            `${method} ${url} ${statusCode} ${contentLength} - ${duration}ms - ${userId} - ${ip} - ${userAgent}`
          )
        },
        error: (error) => {
          const duration = Date.now() - now
          this.logger.error(
            `${method} ${url} ERROR - ${duration}ms - ${userId} - ${ip} - ${error.message}`
          )
        },
      })
    )
  }
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name)
  private readonly SLOW_REQUEST_THRESHOLD = 1000 // 1 second

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url } = request
    const now = Date.now()

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now
        if (duration > this.SLOW_REQUEST_THRESHOLD) {
          this.logger.warn(
            `Slow request detected: ${method} ${url} took ${duration}ms`
          )
        }
      })
    )
  }
}
