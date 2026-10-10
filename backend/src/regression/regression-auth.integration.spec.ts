import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { RegressionController } from './regression.controller';
import { RegressionService } from './regression.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { EvaluationRun } from '../schemas/evaluation-run.schema';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ServiceApiKeyRegistry } from '../auth/service-api-key.registry';

describe('Regression Controller Auth & Contract Integration', () => {
  let controller: RegressionController;
  let regressionService: RegressionService;
  let guard: OptionalJwtAuthGuard;
  let registry: ServiceApiKeyRegistry;
  let reflector: Reflector;

  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    process.env.MODEL_REGRESSION_CLIENT_PR_REVIEW_API_KEY = 'valid-pr-review-secret-key-xyz';
    process.env.MODEL_REGRESSION_CLIENT_PIPELINE_OBSERVABILITY_API_KEY = 'valid-pipe-obs-secret-key-abc';

    const mockEvaluationsService = {
      create: jest.fn().mockResolvedValue({
        _id: 'eval-run-integration-1',
        decision: 'PASS',
        totalCases: 5,
        regressionSummary: {
          passedCount: 5,
          warnCount: 0,
          failedCount: 0,
          regressions: [],
        },
      }),
    };

    const mockRunModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };

    const configService = {
      get: jest.fn((key: string, def?: any) => {
        if (key === 'nodeEnv') return 'development';
        if (key === 'publicAccessEnabled') return true;
        if (key === 'jwt.secret') return 'jwt-secret-xyz';
        return def;
      }),
    } as unknown as ConfigService;

    const jwtService = {
      verify: jest.fn(),
    } as unknown as JwtService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegressionController],
      providers: [
        RegressionService,
        { provide: EvaluationsService, useValue: mockEvaluationsService },
        { provide: getModelToken(EvaluationRun.name), useValue: mockRunModel },
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
        Reflector,
        ServiceApiKeyRegistry,
        OptionalJwtAuthGuard,
      ],
    }).compile();

    controller = module.get<RegressionController>(RegressionController);
    regressionService = module.get<RegressionService>(RegressionService);
    guard = module.get<OptionalJwtAuthGuard>(OptionalJwtAuthGuard);
    registry = module.get<ServiceApiKeyRegistry>(ServiceApiKeyRegistry);
    reflector = module.get<Reflector>(Reflector);

    registry.reloadKeys();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function createMockContext(headers: Record<string, string>, body: any = {}): ExecutionContext {
    const request = {
      headers,
      body,
      query: {},
      correlationId: headers['x-correlation-id'] || 'corr-id-regression-test',
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          setHeader: jest.fn(),
        }),
      }),
      getHandler: () => controller.checkRegression,
      getClass: () => RegressionController,
    } as unknown as ExecutionContext;
  }

  it('should reject unauthenticated calls to POST /regression/check with 401', async () => {
    const context = createMockContext({}, {
      project: 'ai-pr-review-platform',
      datasetId: 'pr-benchmark-v1',
      model: 'gpt-4o',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should authenticate ai-pr-review-platform using x-api-key header', async () => {
    const context = createMockContext(
      { 'x-api-key': 'valid-pr-review-secret-key-xyz' },
      {
        project: 'ai-pr-review-platform',
        datasetId: 'pr-benchmark-v1',
        model: 'gpt-4o',
      },
    );

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);

    const req = context.switchToHttp().getRequest();
    expect(req.service.name).toBe('pr-review');

    const result = await controller.checkRegression(req.body, req);
    expect(result.data.status).toBe('PASS');
    expect(result.data.runId).toBe('eval-run-integration-1');
  });

  it('should authenticate ai-pipeline-observability using Authorization: Bearer <key>', async () => {
    const context = createMockContext(
      { authorization: 'Bearer valid-pipe-obs-secret-key-abc' },
      {
        project: 'ai-pipeline-observability',
        datasetId: 'pipe-benchmark-v1',
        model: 'gemini-1.5-pro',
      },
    );

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);

    const req = context.switchToHttp().getRequest();
    expect(req.service.name).toBe('pipeline-observability');

    const result = await controller.checkRegression(req.body, req);
    expect(result.data.status).toBe('PASS');
  });

  it('should reject service accessing unauthorized tenant/project with 403', async () => {
    const context = createMockContext(
      { 'x-api-key': 'valid-pr-review-secret-key-xyz' },
      {
        project: 'another-unauthorized-tenant',
        datasetId: 'private-data',
        model: 'gpt-4o',
      },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
