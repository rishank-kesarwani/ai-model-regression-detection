import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { Prompt, PromptDocument, PromptVersionItem } from '../schemas/prompt.schema';
import { CreatePromptDto, CreatePromptVersionDto } from './dto/create-prompt.dto';

@Injectable()
export class PromptsService {
  constructor(
    @InjectModel(Prompt.name) private promptModel: Model<PromptDocument>,
  ) {}

  private calculateHash(template: string, systemTemplate?: string): string {
    return crypto
      .createHash('sha256')
      .update(`${template}::${systemTemplate || ''}`)
      .digest('hex')
      .substring(0, 16);
  }

  async create(dto: CreatePromptDto, user: any): Promise<Prompt> {
    const existing = await this.promptModel.findOne({ slug: dto.slug }).exec();
    if (existing) {
      throw new ConflictException(`Prompt with slug "${dto.slug}" already exists`);
    }

    const initialVersion: PromptVersionItem = {
      version: '1.0.0',
      template: dto.initialTemplate,
      systemTemplate: dto.initialSystemTemplate,
      contentHash: this.calculateHash(dto.initialTemplate, dto.initialSystemTemplate),
      createdAt: new Date(),
      tags: dto.tags || [],
      metadata: {},
    };

    const prompt = new this.promptModel({
      name: dto.name,
      slug: dto.slug,
      project: dto.project || 'default',
      latestVersion: '1.0.0',
      versions: [initialVersion],
      description: dto.description || '',
      tags: dto.tags || [],
      createdBy: user?.username || 'anonymous',
    });

    return prompt.save();
  }

  async findAll(project?: string): Promise<Prompt[]> {
    const query = project ? { project } : {};
    return this.promptModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(idOrSlug: string): Promise<Prompt> {
    const prompt = await this.promptModel.findOne({
      $or: [{ _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null }, { slug: idOrSlug }],
    }).exec();

    if (!prompt) {
      throw new NotFoundException(`Prompt "${idOrSlug}" not found`);
    }
    return prompt;
  }

  async addVersion(idOrSlug: string, dto: CreatePromptVersionDto, user: any): Promise<Prompt> {
    const prompt = await this.findOne(idOrSlug);

    const exists = prompt.versions.some((v) => v.version === dto.version);
    if (exists) {
      throw new ConflictException(`Prompt version "${dto.version}" already exists. Versions are immutable.`);
    }

    const newVersion: PromptVersionItem = {
      version: dto.version,
      template: dto.template,
      systemTemplate: dto.systemTemplate,
      contentHash: this.calculateHash(dto.template, dto.systemTemplate),
      createdAt: new Date(),
      tags: dto.tags || [],
      metadata: dto.metadata || {},
    };

    prompt.versions.push(newVersion);
    prompt.latestVersion = dto.version;
    return (prompt as any).save();
  }
}
