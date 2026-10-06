import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { WebhookEvent, WebhookEventDocument } from '../schemas/webhook-event.schema';
import { GitHubEvaluationDto } from './dto/github-eval.dto';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  constructor(
    private evaluationsService: EvaluationsService,
    @InjectModel(WebhookEvent.name) private webhookModel: Model<WebhookEventDocument>,
  ) {}

  async triggerPREvaluation(dto: GitHubEvaluationDto, user: any) {
    this.logger.log(`Received GitHub evaluation trigger for ${dto.repository} PR #${dto.pullRequest} (commit ${dto.commitSha.slice(0, 7)})`);

    // Record webhook event for full auditability
    const webhookRecord = await this.webhookModel.create({
      eventType: 'github.pr.evaluation',
      source: 'github',
      payload: dto,
      status: 'RECEIVED',
    });

    const run = await this.evaluationsService.create(
      {
        project: dto.repository.split('/')[1] || dto.repository,
        datasetId: dto.datasetId,
        datasetVersion: dto.datasetVersion,
        model: dto.model,
        provider: dto.provider,
        promptVersion: dto.promptVersion,
        commitSha: dto.commitSha,
        pullRequest: dto.pullRequest,
        repository: dto.repository,
        baselineRunId: dto.baselineRunId,
        metrics: dto.metrics,
        triggerType: 'github_pr',
        runAsync: false, // execute immediately to return regression decision to PR checks
      },
      user || { username: 'github-action' },
    );

    webhookRecord.status = 'PROCESSED';
    webhookRecord.evaluationRunId = (run as any)._id?.toString() || (run as any).id;
    await webhookRecord.save();

    return {
      runId: (run as any)._id?.toString() || (run as any).id,
      decision: run.decision,
      status: run.status,
      metricsSummary: run.metricsSummary,
      regressionSummary: run.regressionSummary,
      repository: dto.repository,
      pullRequest: dto.pullRequest,
      commitSha: dto.commitSha,
    };
  }
}
