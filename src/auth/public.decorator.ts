// Public Decorator
// Use this decorator to mark routes that don't require authentication
// Example: @Public() on a health check endpoint
import { SetMetadata } from '@nestjs/common'

// The key used to store the "isPublic" metadata
// This is read by the PokeAuthGuard to bypass authentication
export const IS_PUBLIC_KEY = 'isPublic'

// The actual decorator function
// When applied to a route, it marks that route as publicly accessible
// Usage: @Public() above a controller method
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
