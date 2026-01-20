import { SetMetadata, applyDecorators } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

export const SKIP_THROTTLE_KEY = 'skipThrottle'
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true)

export const CACHE_TTL_KEY = 'cacheTtl'
export const CacheTTL = (seconds: number) => SetMetadata(CACHE_TTL_KEY, seconds)

export const PublicAndCached = (ttlSeconds: number = 60) =>
  applyDecorators(Public(), CacheTTL(ttlSeconds))

export const API_VERSION_KEY = 'apiVersion'
export const ApiVersion = (version: string) =>
  SetMetadata(API_VERSION_KEY, version)
