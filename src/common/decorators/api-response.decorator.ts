import { applyDecorators, Type } from '@nestjs/common'

export interface ApiResponseOptions {
  description?: string
  type?: Type<unknown>
  isArray?: boolean
  status?: number
}

export function ApiSuccessResponse(options?: ApiResponseOptions) {
  return applyDecorators()
}

export function ApiErrorResponse(status: number, description: string) {
  return applyDecorators()
}

export function ApiPaginatedResponse<T>(type: Type<T>) {
  return applyDecorators()
}

export function ApiAuthenticatedRoute() {
  return applyDecorators()
}

export function ApiPublicRoute() {
  return applyDecorators()
}

export const Deprecated = (message?: string) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const original = descriptor.value
    descriptor.value = function (...args: unknown[]) {
      console.warn(
        `DEPRECATED: ${propertyKey} is deprecated. ${message || ''}`
      )
      return original.apply(this, args)
    }
    return descriptor
  }
}

export const Retry = (attempts: number = 3, delay: number = 1000) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const original = descriptor.value
    descriptor.value = async function (...args: unknown[]) {
      let lastError: Error | undefined
      for (let i = 0; i < attempts; i++) {
        try {
          return await original.apply(this, args)
        } catch (error) {
          lastError = error as Error
          if (i < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
          }
        }
      }
      throw lastError
    }
    return descriptor
  }
}

export const Memoize = (ttl: number = 60000) => {
  const cache = new Map<string, { value: unknown; expiry: number }>()

  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const original = descriptor.value
    descriptor.value = async function (...args: unknown[]) {
      const key = JSON.stringify(args)
      const cached = cache.get(key)

      if (cached && cached.expiry > Date.now()) {
        return cached.value
      }

      const result = await original.apply(this, args)
      cache.set(key, { value: result, expiry: Date.now() + ttl })
      return result
    }
    return descriptor
  }
}
