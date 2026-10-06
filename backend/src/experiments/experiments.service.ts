import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegressionEngine } from '@ai-model-regression/evaluator';
import { Experiment, ExperimentDocument } from '../schemas/experiment.schema';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';

@Injectable()
export class ExperimentsService {
  private readonly logger = new Logger(ExperimentsService.name);
  private readonly regressionEngine = new RegressionEngine();

  constructor(
    @InjectModel(Experiment.name) private experimentModel: Model<ExperimentDocument>,
    private evaluationsService: EvaluationsService,
  ) {}

  async create(dto: CreateExperimentDto, user: any): Promise<Experiment> {
    this.logger.log(`Starting experiment "${dto.name}" comparing Control (${dto.controlConfig.model}) vs Candidate (${dto.candidateConfig.model})`);

    // 1. Execute Control Evaluation Run
    const controlRun = await this.evaluationsService.create(
      {
        project: dto.project || 'default',
        datasetId: dto.datasetId,
        datasetVersion: dto.datasetVersion,
        model: dto.controlConfig.model,
        provider: dto.controlConfig.provider || 'openai',
        promptVersion: dto.controlConfig.promptVersion,
        applicationVersion: dto.controlConfig.applicationVersion,
        triggerType: 'experiment',
        runAsync: false,
      },
      user,
    );

    // 2. Execute Candidate Evaluation Run against Control Run
    const candidateRun = await this.evaluationsService.create(
      {
        project: dto.project || 'default',
        datasetId: dto.datasetId,
        datasetVersion: dto.datasetVersion,
        model: dto.candidateConfig.model,
        provider: dto.candidateConfig.provider || 'openai',
        promptVersion: dto.candidateConfig.promptVersion,
        applicationVersion: dto.candidateConfig.applicationVersion,
        baselineRunId: (controlRun as any)._id?.toString() || (controlRun as any).id,
        triggerType: 'experiment',
        runAsync: false,
      },
      user,
    );

    const comparisonSummary = this.regressionEngine.compareRuns(
      controlRun.metricsSummary as any,
      candidateRun.metricsSummary as any,
    );

    const experiment = new this.experimentModel({
      name: dto.name,
      project: dto.project || 'default',
      datasetId: dto.datasetId,
      datasetVersion: dto.datasetVersion || '1.0.0',
      controlConfig: {
        ...dto.controlConfig,
        evaluationRunId: (controlRun as any)._id?.toString() || (controlRun as any).id,
      },
      candidateConfig: {
        ...dto.candidateConfig,
        evaluationRunId: (candidateRun as any)._id?.toString() || (candidateRun as any).id,
      },
      status: 'COMPLETED',
      comparisonSummary,
      notes: dto.notes || '',
      createdBy: user?.username || 'anonymous',
    });

    return experiment.save();
  }

  async findAll(project?: string): Promise<Experiment[]> {
    const filter = project ? { project } : {};
    return this.experimentModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Experiment> {
    const exp = await this.experimentModel.findById(id).exec();
    if (!exp) {
      throw new NotFoundException(`Experiment "${id}" not found`);
    }
    return exp;
  }
}
