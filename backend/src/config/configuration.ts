export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  mongodbUri: string;
  redis: {
    url?: string;
    host: string;
    port: number;
    password?: string;
    tls: boolean;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  publicAccessEnabled: boolean;
  aiPlatform: {
    baseUrl: string;
    apiKey: string;
  };
  notification: {
    baseUrl: string;
    apiKey: string;
  };
  github: {
    webhookSecret: string;
  };
  worker: {
    concurrency: number;
    caseTimeoutMs: number;
    maxBatchSize: number;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_model_regression',
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars-long',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  publicAccessEnabled: process.env.PUBLIC_ACCESS_ENABLED !== 'false',
  aiPlatform: {
    baseUrl: process.env.AI_PLATFORM_BASE_URL || 'https://ai-platform.rishankkesharwani.com/api/v1',
    apiKey: process.env.AI_PLATFORM_MODEL_REGRESSION_API_KEY || 'mock-ai-platform-key',
  },
  notification: {
    baseUrl: process.env.NOTIFICATION_SERVICE_BASE_URL || 'https://notifications.rishankkesharwani.com/api/v1',
    apiKey: process.env.NOTIFICATION_MODEL_REGRESSION_API_KEY || 'mock-notification-key',
  },
  github: {
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'dev-gh-secret',
  },
  worker: {
    concurrency: parseInt(process.env.EVAL_WORKER_CONCURRENCY || '5', 10),
    caseTimeoutMs: parseInt(process.env.EVAL_CASE_TIMEOUT_MS || '30000', 10),
    maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '500', 10),
  },
});
