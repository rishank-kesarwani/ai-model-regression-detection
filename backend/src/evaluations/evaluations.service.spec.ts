import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EvaluationsService } from './evaluations.service';
import { EvaluationRun } from '../schemas/evaluation-run.schema';
import { EvaluationResult } from '../schemas/evaluation-result.schema';
import { Baseline } from '../schemas/baseline.schema';
import { DatasetsService } from '../datasets/datasets.service';
import { ModelsService } from '../models/models.service';
import { PoliciesService } from '../policies/policies.service';
import { AiPlatformService } from '../integrations/ai-platform.service';
import { NotificationService } from '../integrations/notification.service';
import { DEFAULT_REGRESSION_POLICY } from '@ai-model-regression/evaluator';

describe('EvaluationsService', () => {
  let service: EvaluationsService;
  let mockRunModel: any;
  let mockResultModel: any;
  let mockBaselineModel: any;
  let mockDatasetsService: any;
  let mockModelsService: any;
  let mockPoliciesService: any;
  let mockAiPlatformService: any;
  let mockNotificationService: any;

  beforeEach(async () => {
    mockRunModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: 'run-123',
      save: jest.fn().mockResolvedValue({ _id: 'run-123', ...dto }),
    }));
    mockRunModel.findById = jest.fn();
    mockRunModel.find = jest.fn();

    mockResultModel = {
      create: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }),
    };

    mockBaselineModel = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    };

    mockDatasetsService = {
      findOne: jest.fn().mockResolvedValue({
        slug: 'test-dataset',
        latestVersion: '1.0.0',
        project: 'default',
        versions: [
          {
            version: '1.0.0',
            contentHash: 'abc1234',
            cases: [
              { id: 'c1', input: 'Hello', expectedOutput: 'World' },
            ],
          },
        ],
      }),
    };

    mockModelsService = {
      getPricingForModel: jest.fn().mockResolvedValue({
        provider: 'openai',
        model: 'gpt-4o',
        inputTokenCostPerMillion: 2.5,
        outputTokenCostPerMillion: 10.0,
        currency: 'USD',
      }),
    };

    mockPoliciesService = {
      getDefaultPolicy: jest.fn().mockResolvedValue(DEFAULT_REGRESSION_POLICY),
      findOne: jest.fn().mockResolvedValue(DEFAULT_REGRESSION_POLICY),
    };

    mockAiPlatformService = {
      generateCompletion: jest.fn().mockResolvedValue({
        output: 'World',
        latencyMs: 150,
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
        estimatedCostUsd: 0.0001,
        provider: 'openai',
        model: 'gpt-4o',
      }),
      runJudge: jest.fn().mockResolvedValue(JSON.stringify({ score: 1.0, reason: 'Good', criteria: { correctness: 1.0 } })),
    };

    mockNotificationService = {
      sendNotification: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        { provide: getModelToken(EvaluationRun.name), useValue: mockRunModel },
        { provide: getModelToken(EvaluationResult.name), useValue: mockResultModel },
        { provide: getModelToken(Baseline.name), useValue: mockBaselineModel },
        { provide: DatasetsService, useValue: mockDatasetsService },
        { provide: ModelsService, useValue: mockModelsService },
        { provide: PoliciesService, useValue: mockPoliciesService },
        { provide: AiPlatformService, useValue: mockAiPlatformService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
  });

  it('should create and execute an evaluation run successfully', async () => {
    mockRunModel.findById.mockImplementation((id: string) => {
      const runDoc: any = {
        _id: id,
        project: 'default',
        datasetId: 'test-dataset',
        datasetVersion: '1.0.0',
        model: 'gpt-4o',
        provider: 'openai',
        status: 'QUEUED',
        reproducibility: {
          enabledMetrics: ['exact_match', 'latency_ms', 'estimated_cost_usd'],
          pricingSnapshot: { inputTokenCostPerMillion: 2.5, outputTokenCostPerMillion: 10 },
        },
        save: jest.fn().mockResolvedValue(true),
      };
      return runDoc;
    });

    const run = await service.create(
      {
        datasetId: 'test-dataset',
        model: 'gpt-4o',
        metrics: ['exact_match', 'latency_ms', 'estimated_cost_usd'],
        runAsync: false,
      },
      { username: 'tester' },
    );

    expect(run).toBeDefined();
    expect(mockAiPlatformService.generateCompletion).toHaveBeenCalled();
    expect(mockNotificationService.sendNotification).toHaveBeenCalled();
  });
});
