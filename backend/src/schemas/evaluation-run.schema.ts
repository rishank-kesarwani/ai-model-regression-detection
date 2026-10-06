import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EvaluationRunStatus } from '@ai-model-regression/evaluator';

export type EvaluationRunDocument = EvaluationRun & Document;

@Schema({ timestamps: true })
export class EvaluationRun {
  @Prop({ required: true, index: true })
  project: string;

  @Prop({ required: true, index: true })
  datasetId: string;

  @Prop({ required: true })
  datasetVersion: string;

  @Prop({ required: true })
  model: string;

  @Prop({ default: 'openai' })
  provider: string;

  @Prop()
  modelVersion?: string;

  @Prop()
  promptVersion?: string;

  @Prop()
  applicationVersion?: string;

  @Prop({ index: true })
  commitSha?: string;

  @Prop()
  pullRequest?: number;

  @Prop()
  repository?: string;

  @Prop({ index: true })
  baselineRunId?: string;

  @Prop({
    type: String,
    enum: Object.values(EvaluationRunStatus),
    default: EvaluationRunStatus.QUEUED,
    index: true,
  })
  status: EvaluationRunStatus;

  @Prop({ default: Date.now })
  startedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ default: 0 })
  totalCases: number;

  @Prop({ default: 0 })
  processedCases: number;

  @Prop({ default: 0 })
  failedCases: number;

  @Prop({ type: Object, default: {} })
  metricsSummary: Record<string, any>;

  @Prop({ default: 'PASS' })
  decision: string;

  @Prop({ type: Object })
  regressionSummary?: Record<string, any>;

  @Prop({ type: Object, required: true })
  reproducibility: Record<string, any>;

  @Prop()
  errorMessage?: string;

  @Prop({ default: 'manual' })
  triggerType: 'manual' | 'scheduled' | 'api' | 'github_pr' | 'experiment';

  @Prop({ default: 'anonymous' })
  createdBy: string;
}

export const EvaluationRunSchema = SchemaFactory.createForClass(EvaluationRun);

EvaluationRunSchema.index({ project: 1, datasetId: 1, createdAt: -1 });
EvaluationRunSchema.index({ commitSha: 1, repository: 1 });
EvaluationRunSchema.index({ status: 1, createdAt: -1 });
EvaluationRunSchema.index({ createdAt: -1 });
