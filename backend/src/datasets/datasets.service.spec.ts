import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { Dataset } from '../schemas/dataset.schema';

describe('DatasetsService', () => {
  let service: DatasetsService;
  let mockDatasetModel: any;

  beforeEach(async () => {
    mockDatasetModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'd123', ...dto }),
    }));
    mockDatasetModel.findOne = jest.fn();
    mockDatasetModel.find = jest.fn();
    mockDatasetModel.deleteOne = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatasetsService,
        {
          provide: getModelToken(Dataset.name),
          useValue: mockDatasetModel,
        },
      ],
    }).compile();

    service = module.get<DatasetsService>(DatasetsService);
  });

  it('should create a dataset with initial immutable version', async () => {
    mockDatasetModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

    const dataset = await service.create(
      {
        name: 'Benchmark 1',
        slug: 'benchmark-1',
      },
      { username: 'admin' },
    );

    expect(dataset.name).toBe('Benchmark 1');
    expect(dataset.latestVersion).toBe('1.0.0');
    expect(dataset.versions).toHaveLength(1);
    expect(dataset.versions[0].contentHash).toBeDefined();
  });

  it('should prevent duplicate dataset slugs', async () => {
    mockDatasetModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ slug: 'benchmark-1' }),
    });

    await expect(
      service.create(
        { name: 'Benchmark 1', slug: 'benchmark-1' },
        { username: 'admin' },
      ),
    ).rejects.toThrow(ConflictException);
  });
});
