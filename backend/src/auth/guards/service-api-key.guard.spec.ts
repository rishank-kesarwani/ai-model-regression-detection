import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ServiceApiKeyGuard } from './service-api-key.guard';
import { ServiceApiKeyRegistry } from '../service-api-key.registry';
import { REQUIRE_SERVICE_AUTH_KEY } from '../decorators/auth-policy.decorator';

describe('ServiceApiKeyGuard & Caller Contracts', () => {
  let guard: ServiceApiKeyGuard;
  let registry: ServiceApiKeyRegistry;
  let reflector: Reflector;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(() => {
    reflector = new Reflector();

    configService = {
      get: jest.fn((key: string, def?: any) => {
        if (key === 'nodeEnv') return 'development';
        if (key === 'jwt.secret') return 'test-jwt-secret';
        return def;
      }),
    } as unknown as ConfigService;

    registry = new ServiceApiKeyRegistry(configService);

    jwtService = {
      verify: jest.fn(),
    } as unknown as JwtService;

    guard = new ServiceApiKeyGuard(reflector, registry, jwtService, configService);
  });

  function createMockContext(headers: Record<string, string>, body: any = {}): ExecutionContext {
    const request = {
      headers,
      body,
      query: {},
      correlationId: headers['x-correlation-id'] || 'test-correlation-id-123',
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          setHeader: jest.fn(),
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('should authenticate ai-pr-review-platform via x-api-key header', async () => {
    process.env.MODEL_REGRESSION_CLIENT_PR_REVIEW_API_KEY = 'secret-pr-review-key-999';
    registry.reloadKeys();

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ allowUser: false });

    const context = createMockContext({
      'x-api-key': 'secret-pr-review-key-999',
    }, { project: 'ai-pr-review-platform' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest();
    expect(req.service.name).toBe('pr-review');
    expect(req.service.authenticated).toBe(true);
    expect(req.user.username).toBe('pr-review');
  });

  it('should authenticate ai-pipeline-observability via Authorization: Bearer <key> header', async () => {
    process.env.MODEL_REGRESSION_CLIENT_PIPELINE_OBSERVABILITY_API_KEY = 'secret-pipe-obs-key-888';
    registry.reloadKeys();

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ allowUser: false });

    const context = createMockContext({
      authorization: 'Bearer secret-pipe-obs-key-888',
    }, { project: 'ai-pipeline-observability' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest();
    expect(req.service.name).toBe('pipeline-observability');
    expect(req.user.username).toBe('pipeline-observability');
  });

  it('should reject requests with missing or invalid service keys with 401', async () => {
    process.env.MODEL_REGRESSION_CLIENT_PR_REVIEW_API_KEY = 'secret-pr-review-key-999';
    registry.reloadKeys();

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ allowUser: false });

    const contextMissing = createMockContext({});
    await expect(guard.canActivate(contextMissing)).rejects.toThrow(UnauthorizedException);

    const contextInvalid = createMockContext({ 'x-api-key': 'wrong-key-value' });
    await expect(guard.canActivate(contextInvalid)).rejects.toThrow(UnauthorizedException);
  });

  it('should enforce project isolation and reject unauthorized project access with 403', async () => {
    process.env.MODEL_REGRESSION_CLIENT_PR_REVIEW_API_KEY = 'secret-pr-review-key-999';
    registry.reloadKeys();

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ allowUser: false });

    const contextUnauthorizedProject = createMockContext(
      { 'x-api-key': 'secret-pr-review-key-999' },
      { project: 'unauthorized-external-tenant' },
    );

    await expect(guard.canActivate(contextUnauthorizedProject)).rejects.toThrow(ForbiddenException);
  });

  it('should accept valid user JWT when allowUser is enabled', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ allowUser: true });

    (jwtService.verify as jest.Mock).mockReturnValue({
      sub: 'usr-42',
      username: 'alice',
      roles: ['user'],
    });

    const context = createMockContext({
      authorization: 'Bearer valid-user-jwt-token',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest();
    expect(req.user.username).toBe('alice');
    expect(req.user.userId).toBe('usr-42');
  });
});
