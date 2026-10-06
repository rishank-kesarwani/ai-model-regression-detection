import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export function getRedisConfig(configService: ConfigService): RedisOptions {
  const redisUrl = configService.get<string>('redis.url');
  if (redisUrl) {
    return {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
    };
  }

  const host = configService.get<string>('redis.host', 'localhost');
  const port = configService.get<number>('redis.port', 6379);
  const password = configService.get<string>('redis.password');
  const tls = configService.get<boolean>('redis.tls', false);

  return {
    host,
    port,
    password: password || undefined,
    tls: tls ? {} : undefined,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
  };
}
