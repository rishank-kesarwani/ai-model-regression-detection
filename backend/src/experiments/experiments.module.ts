import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExperimentsService } from './experiments.service';
import { ExperimentsController } from './experiments.controller';
import { Experiment, ExperimentSchema } from '../schemas/experiment.schema';
import { EvaluationsModule } from '../evaluations/evaluations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Experiment.name, schema: ExperimentSchema },
    ]),
    EvaluationsModule,
  ],
  controllers: [ExperimentsController],
  providers: [ExperimentsService],
  exports: [ExperimentsService],
})
export class ExperimentsModule {}
