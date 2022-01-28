import { Injectable, Inject } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt } from 'passport-jwt'
import { SupabaseAuthStrategy } from 'nestjs-supabase-auth'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class SupabaseStrategy extends PassportStrategy(
  SupabaseAuthStrategy,
  'supabase'
) {
  public constructor(
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    super({
      supabaseUrl: configService.get<string>('SUPABASE_URL'),
      supabaseKey: configService.get<string>('SUPABASE_KEY'),
      supabaseOptions: {},
      supabaseJwtSecret: configService.get<string>('SUPABASE_JWT_SECRET'),
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }
}
