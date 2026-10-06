import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { EvaluationRun, EvaluationRunDocument } from '../schemas/evaluation-run.schema';
import { RegressionCheckDto, RegressionCheckResponseDto } from './dto/regression-check.dto';

@Injectable()
export class RegressionService {
  private readonly logger = new Logger(RegressionService.name);

  constructor(
    private evaluationsService: EvaluationsService,
    @InjectModel(EvaluationRun.name) private runModel: Model<EvaluationRunDocument>,
  ) {}

  async checkRegression(dto: RegressionCheckDto, user: any): Promise<RegressionCheckResponseDto> {
    this.logger.log(`Executing regression check for project "${dto.project}", dataset "${dto.datasetId}" on model "${dto.model}"`);

    const run = await this.evaluationsService.create(
      {
        project: dto.project,
        datasetId: dto.datasetId,
        datasetVersion: dto.datasetVersion,
        model: dto.model,
        provider: dto.provider,
        promptVersion: dto.promptVersion,
        applicationVersion: dto.version,
        baselineRunId: dto.baselineId,
        metrics: dto.metrics,
        policyId: dto.policyId,
        triggerType: 'api',
        runAsync: false, // Run synchronously for PR CI checks
      },
      user,
    );

    const regressionSummary = run.regressionSummary;

    return {
      status: (run.decision as any) || 'PASS',
      runId: (run as any)._id?.toString() || (run as any).id,
      summary: {
        passed: regressionSummary?.passedCount ?? run.totalCases,
        warnings: regressionSummary?.warnCount ?? 0,
        failed: regressionSummary?.failedCount ?? 0,
      },
      regressions: regressionSummary?.regressions ?? [],
    };
  }

  async getRecentRegressions(project?: string, limit: number = 50) {
    const filter: any = { decision: { $in: ['WARN', 'FAIL'] } };
    if (project) filter.project = project;

    const runs = await this.runModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    const flattened = [];
    for (const run of runs) {
      if (run.regressionSummary?.regressions) {
        for (const reg of run.regressionSummary.regressions) {
          if (reg.decision !== 'PASS') {
            flattened.push({
              runId: run._id,
              project: run.project,
              datasetId: run.datasetId,
              model: run.model,
              baselineRunId: run.baselineRunId,
              createdAt: (run as any).createdAt,
              ...reg,
            });
          }
        }
      }
    }

    return flattened;
  }
}
