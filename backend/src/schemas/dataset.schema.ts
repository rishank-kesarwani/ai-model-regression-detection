import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DatasetDocument = Dataset & Document;

@Schema({ _id: false })
export class EvaluationCaseItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  input: string;

  @Prop()
  expectedOutput?: string;

  @Prop({ type: Object })
  expectedJsonSchema?: Record<string, any>;

  @Prop({ default: 'general' })
  category: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 'MEDIUM' })
  difficulty: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

@Schema({ _id: false })
export class DatasetVersionItem {
  @Prop({ required: true })
  version: string;

  @Prop({ required: true })
  contentHash: string;

  @Prop({ type: [EvaluationCaseItem], default: [] })
  cases: EvaluationCaseItem[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: true })
  isImmutable: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

@Schema({ timestamps: true })
export class Dataset {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, default: 'default', index: true })
  project: string;

  @Prop({ default: '1.0.0' })
  latestVersion: string;

  @Prop({ type: [DatasetVersionItem], default: [] })
  versions: DatasetVersionItem[];

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 'admin' })
  createdBy: string;
}

export const DatasetSchema = SchemaFactory.createForClass(Dataset);

DatasetSchema.index({ project: 1, slug: 1 }, { unique: true });
DatasetSchema.index({ createdAt: -1 });
