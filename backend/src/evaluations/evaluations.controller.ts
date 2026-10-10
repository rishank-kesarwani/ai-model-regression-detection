import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import {
  RequireServiceAuth,
  RequireOperator,
  PublicReadOnly,
} from '../auth/decorators/auth-policy.decorator';
import { RateLimit } from '../common/decorators/rate-limit.decorator';

@ApiTags('Evaluations')
@Controller('evaluations')
@UseGuards(OptionalJwtAuthGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @RequireServiceAuth({ allowUser: true })
  @RateLimit({ limit: 20, ttlSeconds: 60 })
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger an evaluation run against a dataset and baseline (Service API key or User JWT)' })
  @ApiResponse({ status: 201, description: 'Evaluation started or completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized service API key or token' })
  @ApiResponse({ status: 403, description: 'Forbidden project scope for service' })
  async create(@Body() createDto: CreateEvaluationDto, @Req() req: any) {
    const run = await this.evaluationsService.create(createDto, req.user);
    return ApiResponseDto.ok(run, 'Evaluation run initiated');
  }

  @PublicReadOnly()
  @Get()
  @ApiOperation({ summary: 'List recent evaluation runs with filtering (Demo read-only access)' })
  async findAll(
    @Query('project') project?: string,
    @Query('datasetId') datasetId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    const runs = await this.evaluationsService.findAll({ project, datasetId, status, limit });
    return ApiResponseDto.ok(runs, 'Evaluation runs retrieved');
  }

  @PublicReadOnly()
  @Get(':id')
  @ApiOperation({ summary: 'Get details and summary of an evaluation run (Demo read-only access)' })
  async findOne(@Param('id') id: string) {
    const run = await this.evaluationsService.findOne(id);
    return ApiResponseDto.ok(run, 'Evaluation run details retrieved');
  }

  @PublicReadOnly()
  @Get(':id/results')
  @ApiOperation({ summary: 'Get detailed individual case evaluation results for a run (Demo read-only access)' })
  async findResults(@Param('id') id: string) {
    const results = await this.evaluationsService.findResultsByRun(id);
    return ApiResponseDto.ok(results, 'Evaluation case results retrieved');
  }

  @RequireOperator()
  @Post(':id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an ongoing or queued evaluation run (Operator access required)' })
  async cancel(@Param('id') id: string) {
    const cancelled = await this.evaluationsService.cancelRun(id);
    return ApiResponseDto.ok({ cancelled }, 'Run cancellation request handled');
  }
}
