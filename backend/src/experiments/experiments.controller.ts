import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExperimentsService } from './experiments.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Experiments')
@Controller('experiments')
@UseGuards(OptionalJwtAuthGuard)
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create and run an A/B evaluation experiment' })
  @ApiResponse({ status: 201, description: 'Experiment created and executed' })
  async create(@Body() createDto: CreateExperimentDto, @Req() req: any) {
    const experiment = await this.experimentsService.create(createDto, req.user);
    return ApiResponseDto.ok(experiment, 'Experiment executed successfully');
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all A/B evaluation experiments' })
  async findAll(@Query('project') project?: string) {
    const experiments = await this.experimentsService.findAll(project);
    return ApiResponseDto.ok(experiments, 'Experiments retrieved');
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get details of an experiment' })
  async findOne(@Param('id') id: string) {
    const experiment = await this.experimentsService.findOne(id);
    return ApiResponseDto.ok(experiment, 'Experiment details retrieved');
  }
}
