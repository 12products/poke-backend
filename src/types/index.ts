export interface AppConfig {
  port: number
  host: string
  nodeEnv: 'development' | 'production' | 'test'
  allowedOrigins: string[]
}

export interface DatabaseConfig {
  url: string
  maxConnections: number
  connectionTimeout: number
}

export interface TwilioConfig {
  accountId: string
  authToken: string
  phoneNumber: string
}

export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceKey: string
}

export interface AppleConfig {
  sharedSecret: string
  environment: 'sandbox' | 'production' | 'both'
}

export interface ThrottleConfig {
  ttl: number
  limit: number
}

export interface FeatureFlags {
  enablePremiumFeatures: boolean
  maxFreeReminders: number
  maxPremiumReminders: number
}

export interface Config {
  app: AppConfig
  database: DatabaseConfig
  twilio: TwilioConfig
  supabase: SupabaseConfig
  apple: AppleConfig
  throttle: ThrottleConfig
  features: FeatureFlags
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Nullable<T> = T | null

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  meta?: {
    timestamp: string
    requestId?: string
    duration?: number
  }
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const DAYS_OF_WEEK: Record<DayOfWeek, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

export type ReminderColor =
  | 'blue'
  | 'green'
  | 'red'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan'

export const REMINDER_COLORS: ReminderColor[] = [
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'orange',
  'pink',
  'cyan',
]
