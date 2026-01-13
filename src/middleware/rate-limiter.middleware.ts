import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

/**
 * Configuration options for rate limiting
 */
export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Maximum requests per window
  message?: string      // Custom error message
  skipPaths?: string[]  // Paths to skip rate limiting
  keyGenerator?: (req: Request) => string // Custom key generator
}

/**
 * In-memory store for rate limit tracking
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,
  message: 'Too many requests, please try again later.',
  skipPaths: ['/health', '/ping'],
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimiterMiddleware.name)
  private readonly store = new Map<string, RateLimitEntry>()
  private readonly config: RateLimitConfig

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), this.config.windowMs)
  }

  /**
   * Generate a unique key for the request
   * Default: IP address
   */
  private getKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req)
    }

    // Use X-Forwarded-For for proxied requests, fallback to IP
    const forwarded = req.headers['x-forwarded-for']
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]
      return ips.trim()
    }

    return req.ip || req.socket.remoteAddress || 'unknown'
  }

  /**
   * Check if the path should skip rate limiting
   */
  private shouldSkip(path: string): boolean {
    return this.config.skipPaths?.some((p) => path.startsWith(p)) ?? false
  }

  /**
   * Clean up expired entries from the store
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`)
    }
  }

  /**
   * Get or create rate limit entry for a key
   */
  private getEntry(key: string): RateLimitEntry {
    const now = Date.now()
    let entry = this.store.get(key)

    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      }
      this.store.set(key, entry)
    }

    return entry
  }

  /**
   * Middleware implementation
   */
  use(req: Request, res: Response, next: NextFunction): void {
    // Skip rate limiting for excluded paths
    if (this.shouldSkip(req.path)) {
      return next()
    }

    const key = this.getKey(req)
    const entry = this.getEntry(key)

    entry.count++

    // Set rate limit headers
    const remaining = Math.max(0, this.config.maxRequests - entry.count)
    const resetSeconds = Math.ceil((entry.resetTime - Date.now()) / 1000)

    res.setHeader('X-RateLimit-Limit', this.config.maxRequests)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', resetSeconds)

    // Check if limit exceeded
    if (entry.count > this.config.maxRequests) {
      this.logger.warn(`Rate limit exceeded for ${key}: ${entry.count}/${this.config.maxRequests}`)

      res.setHeader('Retry-After', resetSeconds)

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: this.config.message,
          retryAfter: resetSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS
      )
    }

    next()
  }

  /**
   * Get current stats for monitoring
   */
  getStats(): { totalKeys: number; totalRequests: number } {
    let totalRequests = 0
    for (const entry of this.store.values()) {
      totalRequests += entry.count
    }

    return {
      totalKeys: this.store.size,
      totalRequests,
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  resetKey(key: string): boolean {
    return this.store.delete(key)
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.store.clear()
    this.logger.log('All rate limits have been reset')
  }
}

/**
 * Factory function to create rate limiter with custom config
 */
export function createRateLimiter(config?: Partial<RateLimitConfig>): RateLimiterMiddleware {
  return new RateLimiterMiddleware(config)
}

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later.',
})

/**
 * More lenient rate limiter for API endpoints
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 200,
  message: 'API rate limit exceeded.',
})
