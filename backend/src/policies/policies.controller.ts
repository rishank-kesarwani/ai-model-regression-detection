import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { RequireOperator, PublicReadOnly } from '../auth/decorators/auth-policy.decorator';

@ApiTags('Regression Policies')
@Controller('policies')
@UseGuards(OptionalJwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @RequireOperator()
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a custom regression policy with thresholds (Operator required)' })
  async create(@Body() createDto: CreatePolicyDto, @Req() req: any) {
    const policy = await this.policiesService.create(createDto, req.user);
    return ApiResponseDto.ok(policy, 'Regression policy created');
  }

  @PublicReadOnly()
  @Get()
  @ApiOperation({ summary: 'Get all regression policies (Demo read-only access)' })
  async findAll(@Query('project') project?: string) {
    const policies = await this.policiesService.findAll(project);
    return ApiResponseDto.ok(policies, 'Policies retrieved');
  }

  @PublicReadOnly()
  @Get('default')
  @ApiOperation({ summary: 'Get the default active regression policy (Demo read-only access)' })
  async getDefault(@Query('project') project?: string) {
    const policy = await this.policiesService.getDefaultPolicy(project);
    return ApiResponseDto.ok(policy, 'Default policy retrieved');
  }

  @PublicReadOnly()
  @Get(':id')
  @ApiOperation({ summary: 'Get a policy by ID (Demo read-only access)' })
  async findOne(@Param('id') id: string) {
    const policy = await this.policiesService.findOne(id);
    return ApiResponseDto.ok(policy, 'Policy retrieved');
  }
}
