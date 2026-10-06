import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_REGRESSION_POLICY } from '@ai-model-regression/evaluator';
import { RegressionPolicy, RegressionPolicyDocument } from '../schemas/regression-policy.schema';
import { CreatePolicyDto } from './dto/create-policy.dto';

@Injectable()
export class PoliciesService implements OnModuleInit {
  private readonly logger = new Logger(PoliciesService.name);

  constructor(
    @InjectModel(RegressionPolicy.name)
    private policyModel: Model<RegressionPolicyDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPolicy();
  }

  private async seedDefaultPolicy() {
    const count = await this.policyModel.countDocuments();
    if (count === 0) {
      this.logger.log('Seeding default regression policy...');
      await this.policyModel.create({
        name: DEFAULT_REGRESSION_POLICY.name,
        project: 'default',
        isDefault: true,
        rules: DEFAULT_REGRESSION_POLICY.rules,
        description: 'Default production regression policy with standard thresholds for quality, latency, and cost.',
        createdBy: 'system',
      });
    }
  }

  async create(dto: CreatePolicyDto, user: any): Promise<RegressionPolicy> {
    if (dto.isDefault) {
      await this.policyModel.updateMany({ project: dto.project || 'default' }, { isDefault: false });
    }

    const policy = new this.policyModel({
      name: dto.name,
      project: dto.project || 'default',
      isDefault: dto.isDefault || false,
      rules: dto.rules,
      description: dto.description || '',
      createdBy: user?.username || 'anonymous',
    });

    return policy.save();
  }

  async findAll(project?: string): Promise<RegressionPolicy[]> {
    const query = project ? { project } : {};
    return this.policyModel.find(query).sort({ isDefault: -1, createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<RegressionPolicy> {
    const policy = await this.policyModel.findById(id).exec();
    if (!policy) {
      throw new NotFoundException(`Policy "${id}" not found`);
    }
    return policy;
  }

  async getDefaultPolicy(project: string = 'default'): Promise<RegressionPolicy> {
    let policy = await this.policyModel.findOne({ project, isDefault: true }).exec();
    if (!policy) {
      policy = await this.policyModel.findOne({ isDefault: true }).exec();
    }
    if (!policy) {
      return DEFAULT_REGRESSION_POLICY as any;
    }
    return policy;
  }
}
