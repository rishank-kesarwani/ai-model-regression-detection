import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  RATE_LIMIT_KEY,
  SKIP_RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';

interface ClientHitRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly hitMap = new Map<string, ClientHitRecord>();

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isSkip = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isSkip) return true;

    const customOptions = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const defaultTtl = this.configService.get<number>('rateLimit.ttl', 60);
    const defaultMax = this.configService.get<number>('rateLimit.max', 100);

    const ttlSeconds = customOptions?.ttlSeconds ?? defaultTtl;
    const maxRequests = customOptions?.limit ?? defaultMax;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.ip ||
      request.connection?.remoteAddress ||
      '127.0.0.1';

    const now = Date.now();
    const windowMs = ttlSeconds * 1000;
    const routeKey = `${clientIp}:${context.getClass().name}.${context.getHandler().name}`;

    let record = RateLimitGuard.hitMap.get(routeKey);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      RateLimitGuard.hitMap.set(routeKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

    if (response?.setHeader) {
      response.setHeader('X-RateLimit-Limit', maxRequests);
      response.setHeader('X-RateLimit-Remaining', remaining);
      response.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
    }

    if (record.count > maxRequests) {
      if (response?.setHeader) {
        response.setHeader('Retry-After', retryAfter);
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please slow down your requests.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  static reset() {
    RateLimitGuard.hitMap.clear();
  }
}
