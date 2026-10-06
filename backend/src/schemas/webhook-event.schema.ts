import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookEventDocument = WebhookEvent & Document;

@Schema({ timestamps: true })
export class WebhookEvent {
  @Prop({ required: true, index: true })
  eventType: string;

  @Prop({ required: true, index: true })
  source: string; // 'github', 'ai_platform', 'ci_cd'

  @Prop({ type: Object, required: true })
  payload: Record<string, any>;

  @Prop({ default: 'PROCESSED' })
  status: 'RECEIVED' | 'PROCESSED' | 'FAILED';

  @Prop()
  evaluationRunId?: string;

  @Prop()
  error?: string;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);

WebhookEventSchema.index({ source: 1, createdAt: -1 });

export type UsageRecordDocument = UsageRecord & Document;

@Schema({ timestamps: true })
export class UsageRecord {
  @Prop({ required: true, index: true })
  project: string;

  @Prop({ required: true, index: true })
  runId: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  provider: string;

  @Prop({ default: 0 })
  promptTokens: number;

  @Prop({ default: 0 })
  completionTokens: number;

  @Prop({ default: 0 })
  totalTokens: number;

  @Prop({ default: 0 })
  totalCostUsd: number;

  @Prop({ default: 0 })
  evaluationCasesCount: number;
}

export const UsageRecordSchema = SchemaFactory.createForClass(UsageRecord);

UsageRecordSchema.index({ project: 1, createdAt: -1 });
