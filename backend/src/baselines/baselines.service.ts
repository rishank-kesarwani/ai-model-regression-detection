import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Baseline, BaselineDocument } from '../schemas/baseline.schema';
import { EvaluationRun, EvaluationRunDocument } from '../schemas/evaluation-run.schema';
import { CreateBaselineDto } from './dto/create-baseline.dto';

@Injectable()
export class BaselinesService {
  constructor(
    @InjectModel(Baseline.name) private baselineModel: Model<BaselineDocument>,
    @InjectModel(EvaluationRun.name) private runModel: Model<EvaluationRunDocument>,
  ) {}

  async create(dto: CreateBaselineDto, user: any): Promise<Baseline> {
    const run = await this.runModel.findById(dto.evaluationRunId).exec();
    if (!run) {
      throw new NotFoundException(`Evaluation run "${dto.evaluationRunId}" does not exist`);
    }

    if (!run.metricsSummary || Object.keys(run.metricsSummary).length === 0) {
      throw new BadRequestException('Evaluation run has no computed metrics summary to use as a baseline');
    }

    const project = dto.project || run.project || 'default';

    // If marked active, deactivate other baselines for this project & dataset
    if (dto.active !== false) {
      await this.baselineModel.updateMany(
        { project, datasetId: dto.datasetId },
        { active: false },
      );
    }

    const baseline = new this.baselineModel({
      name: dto.name,
      project,
      datasetId: dto.datasetId,
      datasetVersion: dto.datasetVersion || run.datasetVersion,
      evaluationRunId: dto.evaluationRunId,
      model: run.model,
      provider: run.provider,
      modelVersion: run.modelVersion,
      promptVersion: run.promptVersion,
      applicationVersion: run.applicationVersion,
      active: dto.active !== false,
      metricsSnapshot: run.metricsSummary,
      notes: dto.notes || '',
      createdBy: user?.username || 'anonymous',
    });

    return baseline.save();
  }

  async findAll(project?: string, datasetId?: string): Promise<Baseline[]> {
    const filter: any = {};
    if (project) filter.project = project;
    if (datasetId) filter.datasetId = datasetId;

    return this.baselineModel.find(filter).sort({ active: -1, createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Baseline> {
    const baseline = await this.baselineModel.findById(id).exec();
    if (!baseline) {
      throw new NotFoundException(`Baseline "${id}" not found`);
    }
    return baseline;
  }

  async activateBaseline(id: string): Promise<Baseline> {
    const baseline = await this.findOne(id);
    await this.baselineModel.updateMany(
      { project: baseline.project, datasetId: baseline.datasetId },
      { active: false },
    );

    baseline.active = true;
    return (baseline as any).save();
  }
}
