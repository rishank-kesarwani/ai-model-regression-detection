import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RegressionService } from './regression.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { EvaluationRun } from '../schemas/evaluation-run.schema';

describe('RegressionService', () => {
  let service: RegressionService;
  let mockEvaluationsService: any;
  let mockRunModel: any;

  beforeEach(async () => {
    mockEvaluationsService = {
      create: jest.fn().mockResolvedValue({
        _id: 'run-pr-1',
        decision: 'PASS',
        totalCases: 10,
        regressionSummary: {
          passedCount: 10,
          warnCount: 0,
          failedCount: 0,
          regressions: [],
        },
      }),
    };

    mockRunModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegressionService,
        { provide: EvaluationsService, useValue: mockEvaluationsService },
        { provide: getModelToken(EvaluationRun.name), useValue: mockRunModel },
      ],
    }).compile();

    service = module.get<RegressionService>(RegressionService);
  });

  it('should satisfy PR review regression check contract', async () => {
    const res = await service.checkRegression(
      {
        project: 'ai-pr-review-platform',
        datasetId: 'pr-benchmark-v1',
        model: 'gpt-4o',
      },
      { username: 'ci-bot' },
    );

    expect(res.status).toBe('PASS');
    expect(res.runId).toBe('run-pr-1');
    expect(res.summary.passed).toBe(10);
    expect(res.summary.failed).toBe(0);
    expect(res.regressions).toEqual([]);
  });
});
