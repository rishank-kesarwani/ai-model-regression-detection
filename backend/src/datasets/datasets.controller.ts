import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DatasetsService } from './datasets.service';
import { CreateDatasetDto, CreateDatasetVersionDto } from './dto/create-dataset.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Datasets')
@Controller('datasets')
@UseGuards(OptionalJwtAuthGuard)
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new evaluation dataset' })
  @ApiResponse({ status: 201, description: 'Dataset created successfully' })
  async create(@Body() createDto: CreateDatasetDto, @Req() req: any) {
    const dataset = await this.datasetsService.create(createDto, req.user);
    return ApiResponseDto.ok(dataset, 'Dataset created successfully');
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all evaluation datasets' })
  async findAll(@Query('project') project?: string) {
    const datasets = await this.datasetsService.findAll(project);
    return ApiResponseDto.ok(datasets, 'Datasets retrieved successfully');
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a single dataset by ID or slug' })
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    const dataset = await this.datasetsService.findOne(idOrSlug);
    return ApiResponseDto.ok(dataset, 'Dataset retrieved successfully');
  }

  @Post(':idOrSlug/versions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a new immutable version for a dataset' })
  async addVersion(
    @Param('idOrSlug') idOrSlug: string,
    @Body() versionDto: CreateDatasetVersionDto,
    @Req() req: any,
  ) {
    const updated = await this.datasetsService.addVersion(idOrSlug, versionDto, req.user);
    return ApiResponseDto.ok(updated, `Version ${versionDto.version} published successfully`);
  }

  @Delete(':idOrSlug')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete dataset (data retention)' })
  async remove(@Param('idOrSlug') idOrSlug: string) {
    const success = await this.datasetsService.delete(idOrSlug);
    return ApiResponseDto.ok({ deleted: success }, 'Dataset deleted');
  }
}
