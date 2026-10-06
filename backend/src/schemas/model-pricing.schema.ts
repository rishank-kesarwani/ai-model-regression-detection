import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ModelPricingDocument = ModelPricingEntity & Document;

@Schema({ timestamps: true })
export class ModelPricingEntity {
  @Prop({ required: true, index: true })
  provider: string;

  @Prop({ required: true, index: true })
  model: string;

  @Prop({ required: true })
  inputTokenCostPerMillion: number;

  @Prop({ required: true })
  outputTokenCostPerMillion: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop()
  effectiveFrom?: Date;

  @Prop()
  effectiveTo?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const ModelPricingSchema = SchemaFactory.createForClass(ModelPricingEntity);

ModelPricingSchema.index({ provider: 1, model: 1 }, { unique: true });
