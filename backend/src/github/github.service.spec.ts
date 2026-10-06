import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GitHubService } from './github.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { WebhookEvent } from '../schemas/webhook-event.schema';

describe('GitHubService (Metadata Adapter)', () => {
  let service: GitHubService;
  let mockEvaluationsService: any;
  let mockWebhookModel: any;

  beforeEach(async () => {
    mockEvaluationsService = {
      create: jest.fn().mockResolvedValue({
        _id: 'run-gh-1',
        decision: 'PASS',
        status: 'COMPLETED',
        metricsSummary: { exact_match: { mean: 0.95 } },
        regressionSummary: { passedCount: 1, warnCount: 0, failedCount: 0 },
      }),
    };

    mockWebhookModel = {
      create: jest.fn().mockResolvedValue({
        status: 'RECEIVED',
        evaluationRunId: null,
        save: jest.fn().mockResolvedValue(true),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubService,
        { provide: EvaluationsService, useValue: mockEvaluationsService },
        { provide: getModelToken(WebhookEvent.name), useValue: mockWebhookModel },
      ],
    }).compile();

    service = module.get<GitHubService>(GitHubService);
  });

  it('should accept evaluation metadata without requiring GitHub App secrets or tokens', async () => {
    const result = await service.triggerPREvaluation(
      {
        repository: 'rishank-kesarwani/ai-pr-review-platform',
        pullRequest: 12,
        commitSha: 'a1b2c3d4e5f6',
        datasetId: 'customer-support-v1',
        model: 'gpt-4o',
      },
      { username: 'ci-caller' },
    );

    expect(result.runId).toBe('run-gh-1');
    expect(result.decision).toBe('PASS');
    expect(result.repository).toBe('rishank-kesarwani/ai-pr-review-platform');
    expect(mockEvaluationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        project: 'ai-pr-review-platform',
        datasetId: 'customer-support-v1',
        model: 'gpt-4o',
        commitSha: 'a1b2c3d4e5f6',
        pullRequest: 12,
        triggerType: 'github_pr',
      }),
      expect.any(Object),
    );
  });
});
