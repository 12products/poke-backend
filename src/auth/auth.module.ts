// Auth module - configures authentication for the application
// Sets up Passport with Supabase strategy
import { Module } from '@nestjs/common'
// Import the Supabase authentication strategy
import { SupabaseStrategy } from './supabase.strategy'
// Passport module for authentication handling
import { PassportModule } from '@nestjs/passport'

// Module decorator configures the auth module
@Module({
  // Import PassportModule to enable authentication
  imports: [PassportModule],
  // Register the Supabase strategy as a provider
  providers: [SupabaseStrategy],
  // Export strategy so it can be used by other modules
  exports: [SupabaseStrategy],
})
// Export the AuthModule class
export class AuthModule {}
