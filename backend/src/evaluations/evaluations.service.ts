import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EvaluatorRegistry,
  RegressionEngine,
  calculateDescriptiveStats,
  EvaluationRunStatus,
  RegressionDecision,
  MetricCategory,
  MetricDirection,
  StandardMetricName,
} from '@ai-model-regression/evaluator';
import { EvaluationRun, EvaluationRunDocument } from '../schemas/evaluation-run.schema';
import { EvaluationResult, EvaluationResultDocument } from '../schemas/evaluation-result.schema';
import { Baseline, BaselineDocument } from '../schemas/baseline.schema';
import { DatasetsService } from '../datasets/datasets.service';
import { ModelsService } from '../models/models.service';
import { PoliciesService } from '../policies/policies.service';
import { AiPlatformService } from '../integrations/ai-platform.service';
import { NotificationService } from '../integrations/notification.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';

@Injectable()
export class EvaluationsService {
  private readonly logger = new Logger(EvaluationsService.name);
  private readonly evaluatorRegistry = new EvaluatorRegistry();
  private readonly regressionEngine = new RegressionEngine();
  private cancelledRunIds = new Set<string>();

  constructor(
    @InjectModel(EvaluationRun.name) private runModel: Model<EvaluationRunDocument>,
    @InjectModel(EvaluationResult.name) private resultModel: Model<EvaluationResultDocument>,
    @InjectModel(Baseline.name) private baselineModel: Model<BaselineDocument>,
    private datasetsService: DatasetsService,
    private modelsService: ModelsService,
    private policiesService: PoliciesService,
    private aiPlatformService: AiPlatformService,
    private notificationService: NotificationService,
  ) {}

  async create(dto: CreateEvaluationDto, user: any): Promise<EvaluationRun> {
    const dataset = await this.datasetsService.findOne(dto.datasetId);
    const targetVersionStr = dto.datasetVersion || dataset.latestVersion;
    const versionObj = dataset.versions.find((v) => v.version === targetVersionStr);

    if (!versionObj) {
      throw new BadRequestException(`Dataset version "${targetVersionStr}" does not exist in dataset "${dataset.slug}"`);
    }

    const provider = dto.provider || 'openai';
    const pricingSnapshot = await this.modelsService.getPricingForModel(provider, dto.model);

    // Auto-resolve baseline if not provided explicitly
    let baselineRunId = dto.baselineRunId;
    if (!baselineRunId) {
      const activeBaseline = await this.baselineModel.findOne({
        project: dto.project || dataset.project || 'default',
        datasetId: dataset.slug,
        active: true,
      }).exec();

      if (activeBaseline) {
        baselineRunId = activeBaseline.evaluationRunId;
      }
    }

    const reproducibility = {
      datasetId: dataset.slug,
      datasetVersion: targetVersionStr,
      datasetContentHash: versionObj.contentHash,
      modelConfig: {
        provider,
        model: dto.model,
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 1024,
      },
      promptVersion: dto.promptVersion || '1.0.0',
      applicationVersion: dto.applicationVersion || '1.0.0',
      evaluatorVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      enabledMetrics: dto.metrics || [
        StandardMetricName.EXACT_MATCH,
        StandardMetricName.STRING_SIMILARITY,
        StandardMetricName.LATENCY_MS,
        StandardMetricName.TOTAL_TOKENS,
        StandardMetricName.ESTIMATED_COST_USD,
        StandardMetricName.AI_JUDGE_SCORE,
      ],
      pricingSnapshot,
    };

    const run = new this.runModel({
      project: dto.project || dataset.project || 'default',
      datasetId: dataset.slug,
      datasetVersion: targetVersionStr,
      model: dto.model,
      provider,
      promptVersion: dto.promptVersion || '1.0.0',
      applicationVersion: dto.applicationVersion || '1.0.0',
      commitSha: dto.commitSha,
      pullRequest: dto.pullRequest,
      repository: dto.repository,
      baselineRunId,
      status: EvaluationRunStatus.QUEUED,
      startedAt: new Date(),
      totalCases: versionObj.cases.length,
      processedCases: 0,
      failedCases: 0,
      metricsSummary: {},
      decision: 'PENDING',
      reproducibility,
      triggerType: dto.triggerType || 'manual',
      createdBy: user?.username || 'anonymous',
    });

    const savedRun = await run.save();

    // Execute asynchronously or synchronously based on runAsync flag
    if (dto.runAsync) {
      setImmediate(() => this.executeRun(savedRun._id.toString(), versionObj.cases, dto.policyId));
      return savedRun;
    } else {
      return this.executeRun(savedRun._id.toString(), versionObj.cases, dto.policyId);
    }
  }

  async executeRun(runId: string, cases: any[], policyId?: string): Promise<EvaluationRun> {
    const run = await this.runModel.findById(runId);
    if (!run) {
      throw new NotFoundException(`Evaluation run ${runId} not found`);
    }

    run.status = EvaluationRunStatus.RUNNING;
    await run.save();

    this.logger.log(`Starting evaluation run ${runId} with ${cases.length} test cases on model ${run.model}`);

    const enabledMetricNames: string[] = run.reproducibility.enabledMetrics || [];
    const metricSampleValues: Record<string, number[]> = {};

    for (const mName of enabledMetricNames) {
      metricSampleValues[mName] = [];
    }

    let processedCount = 0;
    let failedCount = 0;

    for (const testCase of cases) {
      if (this.cancelledRunIds.has(runId)) {
        this.cancelledRunIds.delete(runId);
        run.status = EvaluationRunStatus.CANCELLED;
        run.completedAt = new Date();
        await run.save();
        this.logger.warn(`Evaluation run ${runId} was cancelled by user.`);
        return run;
      }

      try {
        const completion = await this.aiPlatformService.generateCompletion({
          provider: run.provider,
          model: run.model,
          prompt: testCase.input,
          temperature: run.reproducibility?.modelConfig?.temperature ?? 0.7,
          maxTokens: run.reproducibility?.modelConfig?.maxTokens ?? 1024,
          expectedJsonSchema: testCase.expectedJsonSchema,
        });

        const caseMetricResults: Record<string, any> = {};

        for (const mName of enabledMetricNames) {
          const evaluator = this.evaluatorRegistry.get(mName);
          if (!evaluator) continue;

          const singleRes = await evaluator.evaluate({
            modelOutput: completion.output,
            evaluationCase: testCase,
            latencyMs: completion.latencyMs,
            promptTokens: completion.promptTokens,
            completionTokens: completion.completionTokens,
            totalTokens: completion.totalTokens,
            estimatedCostUsd: completion.estimatedCostUsd,
            pricingSnapshot: run.reproducibility.pricingSnapshot,
            judgeProvider: async (prompt) => this.aiPlatformService.runJudge(prompt),
          });

          caseMetricResults[mName] = singleRes;
          if (metricSampleValues[mName]) {
            metricSampleValues[mName].push(singleRes.value);
          }
        }

        await this.resultModel.create({
          runId,
          caseId: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: completion.output,
          latencyMs: completion.latencyMs,
          promptTokens: completion.promptTokens,
          completionTokens: completion.completionTokens,
          totalTokens: completion.totalTokens,
          estimatedCostUsd: completion.estimatedCostUsd,
          isSuccess: true,
          metrics: caseMetricResults,
          metadata: testCase.metadata || {},
        });

        processedCount++;
      } catch (caseErr: any) {
        this.logger.error(`Error evaluating case ${testCase.id} in run ${runId}: ${caseErr.message}`);
        failedCount++;

        await this.resultModel.create({
          runId,
          caseId: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          error: caseErr.message,
          isSuccess: false,
          metrics: {},
        });
      }

      run.processedCases = processedCount;
      run.failedCases = failedCount;
      await run.save();
    }

    // Calculate aggregated metrics summary
    const metricsSummary: Record<string, any> = {};
    for (const [mName, values] of Object.entries(metricSampleValues)) {
      if (values.length === 0) continue;
      const stats = calculateDescriptiveStats(values);
      const evalDef = this.evaluatorRegistry.get(mName);

      metricsSummary[mName] = {
        metricName: mName,
        category: evalDef?.category || MetricCategory.CUSTOM,
        direction: evalDef?.direction || MetricDirection.HIGHER_IS_BETTER,
        unit: evalDef?.unit || 'score',
        mean: stats.mean,
        median: stats.median,
        min: stats.min,
        max: stats.max,
        stdDev: stats.stdDev,
        p50: stats.p50,
        p95: stats.p95,
        p99: stats.p99,
        sampleSize: stats.count,
        isAiJudgeBased: evalDef?.isAiJudgeBased || false,
      };
    }

    run.metricsSummary = metricsSummary;

    // Compare with baseline if present
    let regressionSummary: any = null;
    let decision = RegressionDecision.PASS;

    if (run.baselineRunId) {
      const baselineRun = await this.runModel.findById(run.baselineRunId).exec();
      if (baselineRun && baselineRun.metricsSummary) {
        const policy = policyId
          ? await this.policiesService.findOne(policyId)
          : await this.policiesService.getDefaultPolicy(run.project);

        regressionSummary = this.regressionEngine.compareRuns(
          baselineRun.metricsSummary as any,
          metricsSummary as any,
          {
            policy: policy as any,
            rawSampleData: {
              candidateSamples: metricSampleValues,
            },
          },
        );

        decision = regressionSummary.overallDecision;
        run.regressionSummary = regressionSummary;
      }
    }

    run.decision = decision;
    run.status = failedCount > 0 && processedCount === 0 ? EvaluationRunStatus.FAILED : EvaluationRunStatus.COMPLETED;
    run.completedAt = new Date();
    await run.save();

    // Dispatch notifications
    await this.dispatchRunNotifications(run, regressionSummary);

    return run;
  }

  private async dispatchRunNotifications(run: EvaluationRunDocument, regressionSummary: any) {
    if (run.status === EvaluationRunStatus.FAILED) {
      await this.notificationService.sendNotification({
        eventType: 'EVALUATION_FAILED',
        title: `Evaluation Failed for ${run.model}`,
        message: `Evaluation run ${run._id} for dataset ${run.datasetId} failed on model ${run.model}.`,
        project: run.project,
        runId: run._id.toString(),
        datasetId: run.datasetId,
        decision: 'FAIL',
      });
      return;
    }

    if (run.decision === RegressionDecision.FAIL) {
      const topReg = regressionSummary?.topRegressions?.[0];
      await this.notificationService.sendNotification({
        eventType: 'SEVERE_REGRESSION_DETECTED',
        title: `Severe Regression Detected (${run.model})`,
        message: `Regression detected in ${topReg?.metricName || 'critical metrics'} against baseline ${run.baselineRunId}. Status: FAIL.`,
        project: run.project,
        runId: run._id.toString(),
        datasetId: run.datasetId,
        decision: 'FAIL',
        regressionsCount: regressionSummary?.failedCount || 0,
        details: regressionSummary,
      });
    } else if (run.decision === RegressionDecision.WARN) {
      await this.notificationService.sendNotification({
        eventType: 'REGRESSION_DETECTED',
        title: `Regression Warning for ${run.model}`,
        message: `Evaluation run ${run._id} triggered ${regressionSummary?.warnCount || 0} warning thresholds.`,
        project: run.project,
        runId: run._id.toString(),
        datasetId: run.datasetId,
        decision: 'WARN',
        regressionsCount: regressionSummary?.warnCount || 0,
        details: regressionSummary,
      });
    } else {
      await this.notificationService.sendNotification({
        eventType: 'EVALUATION_COMPLETED',
        title: `Evaluation Passed for ${run.model}`,
        message: `Evaluation run ${run._id} completed successfully with status PASS.`,
        project: run.project,
        runId: run._id.toString(),
        datasetId: run.datasetId,
        decision: 'PASS',
      });
    }
  }

  async findAll(query: { project?: string; datasetId?: string; status?: string; limit?: number }): Promise<EvaluationRun[]> {
    const filter: any = {};
    if (query.project) filter.project = query.project;
    if (query.datasetId) filter.datasetId = query.datasetId;
    if (query.status) filter.status = query.status;

    return this.runModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit || 50)
      .exec();
  }

  async findOne(id: string): Promise<EvaluationRun> {
    const run = await this.runModel.findById(id).exec();
    if (!run) {
      throw new NotFoundException(`Evaluation run "${id}" not found`);
    }
    return run;
  }

  async findResultsByRun(runId: string): Promise<EvaluationResult[]> {
    return this.resultModel.find({ runId }).sort({ createdAt: 1 }).exec();
  }

  async cancelRun(id: string): Promise<boolean> {
    const run = await this.runModel.findById(id);
    if (!run) throw new NotFoundException(`Run "${id}" not found`);

    if (run.status === EvaluationRunStatus.RUNNING || run.status === EvaluationRunStatus.QUEUED) {
      this.cancelledRunIds.add(id);
      run.status = EvaluationRunStatus.CANCELLED;
      run.completedAt = new Date();
      await run.save();
      return true;
    }
    return false;
  }
}
