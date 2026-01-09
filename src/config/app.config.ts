export interface AppConfig {
  port: number;
  host: string;
  environment: string;
  corsOrigin: string;
  apiPrefix: string;
}

export interface DatabaseConfig {
  url: string;
  poolSize: number;
  ssl: boolean;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  twilio: TwilioConfig;
}

export const loadConfig = (): Config => {
  return {
    app: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      environment: process.env.NODE_ENV || 'development',
      corsOrigin: process.env.CORS_ORIGIN || '*',
      apiPrefix: '/v1',
    },
    database: {
      url: process.env.DATABASE_URL || '',
      poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
      ssl: process.env.DB_SSL === 'true',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
  };
};

export const config = loadConfig();
