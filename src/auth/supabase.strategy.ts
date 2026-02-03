// Supabase Authentication Strategy
// This configures Passport to authenticate using Supabase JWTs
// JWTs are extracted from the Authorization header as Bearer tokens
import { Injectable, Inject } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt } from 'passport-jwt' // Utility for extracting JWTs
import { SupabaseAuthStrategy } from 'nestjs-supabase-auth' // Supabase-specific strategy
import { ConfigService } from '@nestjs/config'

// The strategy is injectable and uses Passport under the hood
// We name it 'supabase' so we can reference it in our AuthGuard
@Injectable()
export class SupabaseStrategy extends PassportStrategy(
  SupabaseAuthStrategy,
  'supabase' // Strategy name - used in AuthGuard('supabase')
) {
  // Constructor - configure the strategy with Supabase credentials
  public constructor(
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    // Pass configuration to the parent strategy
    super({
      // The URL of your Supabase project
      supabaseUrl: configService.get<string>('SUPABASE_URL'),
      // The public anon key (safe to expose)
      supabaseKey: configService.get<string>('SUPABASE_KEY'),
      // Additional Supabase client options (empty for now)
      supabaseOptions: {},
      // The JWT secret used to verify tokens
      // This should match your Supabase project's JWT secret
      supabaseJwtSecret: configService.get<string>('SUPABASE_JWT_SECRET'),
      // How to extract the JWT from incoming requests
      // We expect it in the Authorization header: "Bearer <token>"
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }
}

// When a request comes in with a valid JWT:
// 1. The token is extracted from the Authorization header
// 2. It's validated using the JWT secret
// 3. The decoded user info is attached to request.user
// 4. Controller methods can access it via @CurrentUser()
