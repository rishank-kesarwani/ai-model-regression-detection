import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromptDocument = Prompt & Document;

@Schema({ _id: false })
export class PromptVersionItem {
  @Prop({ required: true })
  version: string;

  @Prop({ required: true })
  template: string;

  @Prop()
  systemTemplate?: string;

  @Prop({ required: true })
  contentHash: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

@Schema({ timestamps: true })
export class Prompt {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true, default: 'default', index: true })
  project: string;

  @Prop({ default: '1.0.0' })
  latestVersion: string;

  @Prop({ type: [PromptVersionItem], default: [] })
  versions: PromptVersionItem[];

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 'admin' })
  createdBy: string;
}

export const PromptSchema = SchemaFactory.createForClass(Prompt);

PromptSchema.index({ project: 1, slug: 1 }, { unique: true });
PromptSchema.index({ createdAt: -1 });
