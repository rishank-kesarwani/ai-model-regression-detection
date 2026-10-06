import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BaselinesService } from './baselines.service';
import { BaselinesController } from './baselines.controller';
import { Baseline, BaselineSchema } from '../schemas/baseline.schema';
import { EvaluationRun, EvaluationRunSchema } from '../schemas/evaluation-run.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Baseline.name, schema: BaselineSchema },
      { name: EvaluationRun.name, schema: EvaluationRunSchema },
    ]),
  ],
  controllers: [BaselinesController],
  providers: [BaselinesService],
  exports: [BaselinesService],
})
export class BaselinesModule {}
