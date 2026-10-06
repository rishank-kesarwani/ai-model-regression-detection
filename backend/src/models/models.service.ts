import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_MODEL_PRICING_CATALOG } from '@ai-model-regression/evaluator';
import { ModelPricingEntity, ModelPricingDocument } from '../schemas/model-pricing.schema';
import { UpdateModelPricingDto } from './dto/pricing.dto';

@Injectable()
export class ModelsService implements OnModuleInit {
  private readonly logger = new Logger(ModelsService.name);

  constructor(
    @InjectModel(ModelPricingEntity.name)
    private pricingModel: Model<ModelPricingDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPricing();
  }

  private async seedDefaultPricing() {
    const count = await this.pricingModel.countDocuments();
    if (count === 0) {
      this.logger.log('Seeding initial model pricing catalog...');
      const records = DEFAULT_MODEL_PRICING_CATALOG.map((p) => ({
        provider: p.provider,
        model: p.model,
        inputTokenCostPerMillion: p.inputTokenCostPerMillion,
        outputTokenCostPerMillion: p.outputTokenCostPerMillion,
        currency: p.currency,
        isActive: true,
      }));
      await this.pricingModel.insertMany(records);
    }
  }

  async getAllPricing(): Promise<ModelPricingEntity[]> {
    return this.pricingModel.find({ isActive: true }).sort({ provider: 1, model: 1 }).exec();
  }

  async getPricingForModel(provider: string, model: string): Promise<ModelPricingEntity | null> {
    return this.pricingModel.findOne({
      provider: provider.toLowerCase(),
      model: model.toLowerCase(),
      isActive: true,
    }).exec();
  }

  async upsertPricing(dto: UpdateModelPricingDto): Promise<ModelPricingEntity> {
    return this.pricingModel.findOneAndUpdate(
      { provider: dto.provider.toLowerCase(), model: dto.model.toLowerCase() },
      {
        provider: dto.provider.toLowerCase(),
        model: dto.model.toLowerCase(),
        inputTokenCostPerMillion: dto.inputTokenCostPerMillion,
        outputTokenCostPerMillion: dto.outputTokenCostPerMillion,
        currency: dto.currency || 'USD',
        isActive: true,
      },
      { upsert: true, new: true },
    ).exec();
  }
}
