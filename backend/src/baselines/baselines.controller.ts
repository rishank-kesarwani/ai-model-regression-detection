import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BaselinesService } from './baselines.service';
import { CreateBaselineDto } from './dto/create-baseline.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { RequireOperator, PublicReadOnly } from '../auth/decorators/auth-policy.decorator';

@ApiTags('Baselines')
@Controller('baselines')
@UseGuards(OptionalJwtAuthGuard)
export class BaselinesController {
  constructor(private readonly baselinesService: BaselinesService) {}

  @RequireOperator()
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new baseline from an accepted evaluation run (Operator required)' })
  @ApiResponse({ status: 201, description: 'Baseline created' })
  async create(@Body() createDto: CreateBaselineDto, @Req() req: any) {
    const baseline = await this.baselinesService.create(createDto, req.user);
    return ApiResponseDto.ok(baseline, 'Baseline created and activated successfully');
  }

  @PublicReadOnly()
  @Get()
  @ApiOperation({ summary: 'List all baselines (Demo read-only access)' })
  async findAll(
    @Query('project') project?: string,
    @Query('datasetId') datasetId?: string,
  ) {
    const baselines = await this.baselinesService.findAll(project, datasetId);
    return ApiResponseDto.ok(baselines, 'Baselines retrieved');
  }

  @PublicReadOnly()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single baseline by ID (Demo read-only access)' })
  async findOne(@Param('id') id: string) {
    const baseline = await this.baselinesService.findOne(id);
    return ApiResponseDto.ok(baseline, 'Baseline retrieved');
  }

  @RequireOperator()
  @Post(':id/activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set baseline as active for its dataset (Operator required)' })
  async activate(@Param('id') id: string) {
    const updated = await this.baselinesService.activateBaseline(id);
    return ApiResponseDto.ok(updated, 'Baseline activated');
  }
}
