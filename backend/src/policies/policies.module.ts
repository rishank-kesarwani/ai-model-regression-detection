import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { RegressionPolicy, RegressionPolicySchema } from '../schemas/regression-policy.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RegressionPolicy.name, schema: RegressionPolicySchema },
    ]),
  ],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
