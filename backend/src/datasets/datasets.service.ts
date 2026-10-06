import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { Dataset, DatasetDocument, DatasetVersionItem } from '../schemas/dataset.schema';
import { CreateDatasetDto, CreateDatasetVersionDto } from './dto/create-dataset.dto';

@Injectable()
export class DatasetsService {
  constructor(
    @InjectModel(Dataset.name) private datasetModel: Model<DatasetDocument>,
  ) {}

  private calculateContentHash(cases: any[]): string {
    const raw = JSON.stringify(cases);
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
  }

  async create(dto: CreateDatasetDto, user: any): Promise<Dataset> {
    const existing = await this.datasetModel.findOne({ slug: dto.slug }).exec();
    if (existing) {
      throw new ConflictException(`Dataset with slug "${dto.slug}" already exists`);
    }

    const cases = dto.initialCases || [
      {
        id: 'case-demo-1',
        input: 'What is model regression in LLMs?',
        expectedOutput: 'Model regression refers to unintended degradation in quality, accuracy, latency, safety, or cost when updating LLM models or prompts.',
        category: 'general',
        tags: ['demo', 'qa'],
        difficulty: 'EASY',
        metadata: {},
      },
    ];

    const initialVersion: DatasetVersionItem = {
      version: '1.0.0',
      contentHash: this.calculateContentHash(cases),
      cases: cases as any,
      createdAt: new Date(),
      isImmutable: true,
      metadata: {},
    };

    const dataset = new this.datasetModel({
      name: dto.name,
      slug: dto.slug,
      project: dto.project || 'default',
      latestVersion: '1.0.0',
      versions: [initialVersion],
      description: dto.description || '',
      tags: dto.tags || [],
      createdBy: user?.username || 'anonymous',
    });

    return dataset.save();
  }

  async findAll(project?: string): Promise<Dataset[]> {
    const query = project ? { project } : {};
    return this.datasetModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(idOrSlug: string): Promise<Dataset> {
    const dataset = await this.datasetModel.findOne({
      $or: [{ _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null }, { slug: idOrSlug }],
    }).exec();

    if (!dataset) {
      throw new NotFoundException(`Dataset "${idOrSlug}" not found`);
    }
    return dataset;
  }

  async addVersion(idOrSlug: string, dto: CreateDatasetVersionDto, user: any): Promise<Dataset> {
    const dataset = await this.findOne(idOrSlug);

    const versionExists = dataset.versions.some((v) => v.version === dto.version);
    if (versionExists) {
      throw new ConflictException(`Version "${dto.version}" already exists for this dataset. Dataset versions are immutable.`);
    }

    const newVersion: DatasetVersionItem = {
      version: dto.version,
      contentHash: this.calculateContentHash(dto.cases),
      cases: dto.cases as any,
      createdAt: new Date(),
      isImmutable: true,
      metadata: dto.metadata || {},
    };

    dataset.versions.push(newVersion);
    dataset.latestVersion = dto.version;
    return (dataset as any).save();
  }

  async delete(idOrSlug: string): Promise<boolean> {
    const res = await this.datasetModel.deleteOne({
      $or: [{ _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null }, { slug: idOrSlug }],
    }).exec();
    return res.deletedCount > 0;
  }
}
