import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationRun, EvaluationRunSchema } from '../schemas/evaluation-run.schema';
import { EvaluationResult, EvaluationResultSchema } from '../schemas/evaluation-result.schema';
import { Baseline, BaselineSchema } from '../schemas/baseline.schema';
import { DatasetsModule } from '../datasets/datasets.module';
import { ModelsModule } from '../models/models.module';
import { PoliciesModule } from '../policies/policies.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EvaluationRun.name, schema: EvaluationRunSchema },
      { name: EvaluationResult.name, schema: EvaluationResultSchema },
      { name: Baseline.name, schema: BaselineSchema },
    ]),
    DatasetsModule,
    ModelsModule,
    PoliciesModule,
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
