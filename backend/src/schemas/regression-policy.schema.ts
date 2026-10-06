import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RegressionPolicyDocument = RegressionPolicy & Document;

@Schema({ timestamps: true })
export class RegressionPolicy {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, default: 'default', index: true })
  project: string;

  @Prop({ default: false, index: true })
  isDefault: boolean;

  @Prop({ type: [Object], default: [] })
  rules: any[];

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 'admin' })
  createdBy: string;
}

export const RegressionPolicySchema = SchemaFactory.createForClass(RegressionPolicy);

RegressionPolicySchema.index({ project: 1, isDefault: 1 });
RegressionPolicySchema.index({ createdAt: -1 });
