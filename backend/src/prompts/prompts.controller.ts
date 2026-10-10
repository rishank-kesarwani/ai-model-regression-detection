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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PromptsService } from './prompts.service';
import { CreatePromptDto, CreatePromptVersionDto } from './dto/create-prompt.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { RequireOperator, PublicReadOnly } from '../auth/decorators/auth-policy.decorator';

@ApiTags('Prompts')
@Controller('prompts')
@UseGuards(OptionalJwtAuthGuard)
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @RequireOperator()
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new prompt with an initial immutable version (Operator required)' })
  async create(@Body() createDto: CreatePromptDto, @Req() req: any) {
    const prompt = await this.promptsService.create(createDto, req.user);
    return ApiResponseDto.ok(prompt, 'Prompt created successfully');
  }

  @PublicReadOnly()
  @Get()
  @ApiOperation({ summary: 'List all prompts and their latest versions (Demo read-only access)' })
  async findAll(@Query('project') project?: string) {
    const prompts = await this.promptsService.findAll(project);
    return ApiResponseDto.ok(prompts, 'Prompts retrieved successfully');
  }

  @PublicReadOnly()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a prompt by ID or slug (Demo read-only access)' })
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    const prompt = await this.promptsService.findOne(idOrSlug);
    return ApiResponseDto.ok(prompt, 'Prompt retrieved successfully');
  }

  @RequireOperator()
  @Post(':idOrSlug/versions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish an immutable new version for a prompt (Operator required)' })
  async addVersion(
    @Param('idOrSlug') idOrSlug: string,
    @Body() versionDto: CreatePromptVersionDto,
    @Req() req: any,
  ) {
    const updated = await this.promptsService.addVersion(idOrSlug, versionDto, req.user);
    return ApiResponseDto.ok(updated, `Version ${versionDto.version} published`);
  }
}
