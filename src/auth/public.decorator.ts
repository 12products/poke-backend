// The public decorator - making routes accessible to everyone
// It's like leaving your front door open, but on purpose
import { SetMetadata } from '@nestjs/common'

// This key unlocks the public gates
export const IS_PUBLIC_KEY = 'isPublic'

// Slap this decorator on a route and boom - everyone's invited!
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
