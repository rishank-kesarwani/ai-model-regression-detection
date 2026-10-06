import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsService } from './models.service';
import { ModelsController } from './models.controller';
import { ModelPricingEntity, ModelPricingSchema } from '../schemas/model-pricing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModelPricingEntity.name, schema: ModelPricingSchema },
    ]),
  ],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
