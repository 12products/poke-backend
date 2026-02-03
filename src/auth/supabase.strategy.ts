// Supabase authentication strategy implementation
// This integrates Supabase Auth with NestJS Passport
import { Injectable, Inject } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt } from 'passport-jwt'
// Third-party library for Supabase + NestJS integration
import { SupabaseAuthStrategy } from 'nestjs-supabase-auth'
import { ConfigService } from '@nestjs/config'

// Define the Supabase strategy with name 'supabase'
// This name is referenced in the PokeAuthGuard
@Injectable()
export class SupabaseStrategy extends PassportStrategy(
  SupabaseAuthStrategy,
  'supabase'
) {
  // Constructor injection of ConfigService for environment variables
  public constructor(
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    // Pass configuration to the parent Supabase strategy
    super({
      // Supabase project URL from environment
      supabaseUrl: configService.get<string>('SUPABASE_URL'),
      // Supabase anon/public key
      supabaseKey: configService.get<string>('SUPABASE_KEY'),
      // Additional Supabase client options (empty for now)
      supabaseOptions: {},
      // JWT secret for token verification
      supabaseJwtSecret: configService.get<string>('SUPABASE_JWT_SECRET'),
      // Extract JWT from Authorization: Bearer <token> header
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }
}
