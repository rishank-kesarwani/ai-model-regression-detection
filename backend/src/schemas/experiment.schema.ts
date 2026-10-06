import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExperimentDocument = Experiment & Document;

@Schema({ timestamps: true })
export class Experiment {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, default: 'default', index: true })
  project: string;

  @Prop({ required: true })
  datasetId: string;

  @Prop({ required: true })
  datasetVersion: string;

  @Prop({ type: Object, required: true })
  controlConfig: {
    model: string;
    provider?: string;
    promptVersion?: string;
    applicationVersion?: string;
    temperature?: number;
    evaluationRunId?: string;
  };

  @Prop({ type: Object, required: true })
  candidateConfig: {
    model: string;
    provider?: string;
    promptVersion?: string;
    applicationVersion?: string;
    temperature?: number;
    evaluationRunId?: string;
  };

  @Prop({ default: 'PENDING', index: true })
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

  @Prop({ type: Object })
  comparisonSummary?: Record<string, any>;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: 'admin' })
  createdBy: string;
}

export const ExperimentSchema = SchemaFactory.createForClass(Experiment);

ExperimentSchema.index({ project: 1, createdAt: -1 });
