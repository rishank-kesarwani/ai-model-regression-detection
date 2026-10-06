import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatasetsService } from './datasets.service';
import { DatasetsController } from './datasets.controller';
import { Dataset, DatasetSchema } from '../schemas/dataset.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dataset.name, schema: DatasetSchema }]),
  ],
  controllers: [DatasetsController],
  providers: [DatasetsService],
  exports: [DatasetsService],
})
export class DatasetsModule {}
