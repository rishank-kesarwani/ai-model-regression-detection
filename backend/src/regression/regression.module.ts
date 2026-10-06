import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegressionService } from './regression.service';
import { RegressionController } from './regression.controller';
import { EvaluationRun, EvaluationRunSchema } from '../schemas/evaluation-run.schema';
import { EvaluationsModule } from '../evaluations/evaluations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EvaluationRun.name, schema: EvaluationRunSchema },
    ]),
    EvaluationsModule,
  ],
  controllers: [RegressionController],
  providers: [RegressionService],
  exports: [RegressionService],
})
export class RegressionModule {}
