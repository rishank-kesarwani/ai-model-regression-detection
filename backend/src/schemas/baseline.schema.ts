import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BaselineDocument = Baseline & Document;

@Schema({ timestamps: true })
export class Baseline {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, default: 'default', index: true })
  project: string;

  @Prop({ required: true, index: true })
  datasetId: string;

  @Prop({ required: true })
  datasetVersion: string;

  @Prop({ required: true })
  evaluationRunId: string;

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

  @Prop({ default: true, index: true })
  active: boolean;

  @Prop({ type: Object, required: true })
  metricsSnapshot: Record<string, any>;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: 'admin' })
  createdBy: string;
}

export const BaselineSchema = SchemaFactory.createForClass(Baseline);

BaselineSchema.index({ project: 1, datasetId: 1, active: 1 });
BaselineSchema.index({ evaluationRunId: 1 });
BaselineSchema.index({ createdAt: -1 });
