import { ExecutionContext, UnauthorizedException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OptionalJwtAuthGuard } from './jwt.strategy';
import { ServiceApiKeyRegistry } from './service-api-key.registry';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import {
  REQUIRE_SERVICE_AUTH_KEY,
  REQUIRE_OPERATOR_KEY,
  REQUIRE_USER_KEY,
  PUBLIC_READ_ONLY_KEY,
} from './decorators/auth-policy.decorator';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { SKIP_RATE_LIMIT_KEY } from '../common/decorators/rate-limit.decorator';

describe('Public Access & Authentication Policy Suite', () => {
  let reflector: jest.Mocked<Reflector>;
  let configService: jest.Mocked<ConfigService>;
  let serviceApiKeyRegistry: ServiceApiKeyRegistry;
  let jwtService: jest.Mocked<JwtService>;
  let guard: OptionalJwtAuthGuard;

  const mockKey = 'mreg_test_client_key_abcdef1234567890';

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'publicAccessEnabled') return true;
        if (key === 'jwt.secret') return 'test-secret';
        if (key === 'rateLimit.ttl') return 60;
        if (key === 'rateLimit.max') return 5;
        return defaultValue;
      }),
    } as any;

    const originalEnv = { ...process.env };
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      MODEL_REGRESSION_CLIENT_PR_REVIEW_API_KEY: mockKey,
      MODEL_REGRESSION_CLIENT_PR_REVIEW_ALLOWED_PROJECTS: 'project-a,project-b',
    };

    serviceApiKeyRegistry = new ServiceApiKeyRegistry(configService);
    serviceApiKeyRegistry.onModuleInit();

    jwtService = {
      verify: jest.fn(),
    } as any;

    guard = new OptionalJwtAuthGuard(
      reflector,
      configService,
      serviceApiKeyRegistry,
      jwtService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createMockContext(headers: Record<string, string> = {}, body: any = {}, query: any = {}): ExecutionContext {
    const request = {
      headers: { ...headers },
      body,
      query,
      cookies: {},
      user: null as any,
      service: null as any,
    };
    const response = {
      setHeader: jest.fn(),
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getHandler: () => ({}),
      getClass: () => ({ name: 'TestController' }),
    } as any;
  }

  describe('When PUBLIC_ACCESS_ENABLED=true', () => {
    beforeEach(() => {
      (configService.get as jest.Mock).mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'publicAccessEnabled') return true;
        if (key === 'jwt.secret') return 'test-secret';
        return defaultValue;
      });
    });

    it('allows anonymous visitor access to @PublicReadOnly() demo routes', async () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === PUBLIC_READ_ONLY_KEY) return true;
        return undefined;
      });

      const context = createMockContext();
      const canActivate = await guard.canActivate(context);

      expect(canActivate).toBe(true);
      const req = context.switchToHttp().getRequest();
      expect(req.user).toBeDefined();
      expect(req.user.roles).toContain('anonymous');
    });

    it('allows anonymous access to explicit @Public() routes (e.g. health check)', async () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return true;
        return undefined;
      });

      const context = createMockContext();
      const canActivate = await guard.canActivate(context);

      expect(canActivate).toBe(true);
    });

    it('rejects anonymous access to @RequireOperator() routes with 401 Unauthorized', async () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === REQUIRE_OPERATOR_KEY) return true;
        return undefined;
      });

      const context = createMockContext();
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('allows @RequireOperator() access for authenticated operators', async () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === REQUIRE_OPERATOR_KEY) return true;
        return undefined;
      });

      // Mock passport jwt validation succeeding with operator role on super
      jest.spyOn(Object.getPrototypeOf(OptionalJwtAuthGuard.prototype), 'canActivate').mockImplementation(async function (this: any, ctx: any) {
        ctx.switchToHttp().getRequest().user = { userId: 'op-1', roles: ['operator'] };
        return true;
      });

      const context = createMockContext({ authorization: 'Bearer valid-operator-token' });
      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it('rejects @RequireOperator() access for authenticated users without operator role with 403 Forbidden', async () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === REQUIRE_OPERATOR_KEY) return true;
        return undefined;
      });

      jest.spyOn(Object.getPrototypeOf(OptionalJwtAuthGuard.prototype), 'canActivate').mockImplementation(async function (this: any, ctx: any) {
        ctx.switchToHttp().getRequest().user = { userId: 'user-1', roles: ['user'] };
        return true;
      });

      const context = createMockContext({ authorization: 'Bearer valid-user-token' });
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('STRICT: requires service key on @RequireServiceAuth() even when PUBLIC_ACCESS_ENABLED is true', async () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === REQUIRE_SERVICE_AUTH_KEY) return { allowUser: true };
        if (key === IS_PUBLIC_KEY) return true; // public decorator attempted
        return undefined;
      });

      const context = createMockContext();
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('permits internal service call with valid service key and attaches service identity', async () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === REQUIRE_SERVICE_AUTH_KEY) return { allowUser: true };
        return undefined;
      });

      const context = createMockContext({ 'x-api-key': mockKey }, { project: 'project-a' });
      const canActivate = await guard.canActivate(context);

      expect(canActivate).toBe(true);
      const req = context.switchToHttp().getRequest();
      expect(req.service?.name).toBe('pr-review');
      expect(req.user?.userId).toBe('service:pr-review');
    });

    it('enforces project isolation and rejects cross-project access with 403 FORBIDDEN_PROJECT_SCOPE', async () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === REQUIRE_SERVICE_AUTH_KEY) return { allowUser: true };
        return undefined;
      });

      const context = createMockContext({ 'x-api-key': mockKey }, { project: 'unauthorized-project-x' });
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('When PUBLIC_ACCESS_ENABLED=false', () => {
    beforeEach(() => {
      (configService.get as jest.Mock).mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'publicAccessEnabled') return false;
        if (key === 'jwt.secret') return 'test-secret';
        return defaultValue;
      });
    });

    it('rejects anonymous access to @PublicReadOnly() demo routes when public access is disabled', async () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === PUBLIC_READ_ONLY_KEY) return true;
        return undefined;
      });

      // When publicAccessEnabled is false, super.canActivate is invoked for unauthenticated request
      jest.spyOn(Object.getPrototypeOf(OptionalJwtAuthGuard.prototype), 'canActivate').mockImplementation(async function () {
        throw new UnauthorizedException('Authentication required');
      });

      const context = createMockContext();
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('still permits @Public() infrastructure routes (e.g. /health) when public access is disabled', async () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return true;
        return undefined;
      });

      const context = createMockContext();
      const canActivate = await guard.canActivate(context);
      expect(canActivate).toBe(true);
    });
  });

  describe('Rate Limiting & Abuse Prevention', () => {
    let rateLimitGuard: RateLimitGuard;

    beforeEach(() => {
      RateLimitGuard.reset();
      rateLimitGuard = new RateLimitGuard(reflector, configService);
    });

    it('allows requests within rate limits and sets headers', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockContext();
      expect(rateLimitGuard.canActivate(context)).toBe(true);

      const res = context.switchToHttp().getResponse();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
    });

    it('rejects requests exceeding rate limits with 429 Too Many Requests', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockContext();
      // Execute 5 allowed requests
      for (let i = 0; i < 5; i++) {
        rateLimitGuard.canActivate(context);
      }

      // 6th request must throw 429
      expect(() => rateLimitGuard.canActivate(context)).toThrow(HttpException);
      try {
        rateLimitGuard.canActivate(context);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('skips rate limiting when @SkipRateLimit() decorator is present', () => {
      reflector.getAllAndOverride.mockImplementation((key: string) => {
        if (key === SKIP_RATE_LIMIT_KEY) return true;
        return undefined;
      });

      const context = createMockContext();
      // Even with multiple hits, it succeeds
      for (let i = 0; i < 10; i++) {
        expect(rateLimitGuard.canActivate(context)).toBe(true);
      }
    });
  });
});
