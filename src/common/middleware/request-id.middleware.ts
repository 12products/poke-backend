import { Injectable, NestMiddleware } from '@nestjs/common'
import { FastifyRequest, FastifyReply } from 'fastify'

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    const requestId =
      (req.headers['x-request-id'] as string) || this.generateRequestId()

    req.headers['x-request-id'] = requestId
    res.header('X-Request-Id', requestId)

    next()
  }

  private generateRequestId(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2, 9)
    return `${timestamp}-${randomPart}`
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      this.generateCorrelationId()

    req.headers['x-correlation-id'] = correlationId
    res.header('X-Correlation-Id', correlationId)

    next()
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }
}
