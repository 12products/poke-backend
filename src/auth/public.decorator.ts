// Public decorator - marks routes that don't require authentication
// Used to bypass the global auth guard for specific endpoints
import { SetMetadata } from '@nestjs/common'

// Metadata key used to identify public routes
// This key is checked in the PokeAuthGuard
export const IS_PUBLIC_KEY = 'isPublic'

// Decorator function to mark a route as publicly accessible
// Usage: @Public() above a controller method
// Example: The Twilio webhook endpoint needs to be public
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
