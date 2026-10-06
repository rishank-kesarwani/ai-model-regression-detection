import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EvaluationResultDocument = EvaluationResult & Document;

@Schema({ timestamps: true })
export class EvaluationResult {
  @Prop({ required: true, index: true })
  runId: string;

  @Prop({ required: true, index: true })
  caseId: string;

  @Prop({ required: true })
  input: string;

  @Prop()
  expectedOutput?: string;

  @Prop({ default: '' })
  actualOutput: string;

  @Prop()
  error?: string;

  @Prop({ default: 0 })
  latencyMs: number;

  @Prop({ default: 0 })
  promptTokens: number;

  @Prop({ default: 0 })
  completionTokens: number;

  @Prop({ default: 0 })
  totalTokens: number;

  @Prop({ default: 0 })
  estimatedCostUsd: number;

  @Prop({ default: true })
  isSuccess: boolean;

  @Prop({ type: Object, default: {} })
  metrics: Record<string, any>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const EvaluationResultSchema = SchemaFactory.createForClass(EvaluationResult);

EvaluationResultSchema.index({ runId: 1, caseId: 1 }, { unique: true });
EvaluationResultSchema.index({ runId: 1, isSuccess: 1 });
EvaluationResultSchema.index({ createdAt: -1 });
