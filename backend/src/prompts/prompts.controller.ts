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
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Prompts')
@Controller('prompts')
@UseGuards(OptionalJwtAuthGuard)
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new prompt with an initial immutable version' })
  async create(@Body() createDto: CreatePromptDto, @Req() req: any) {
    const prompt = await this.promptsService.create(createDto, req.user);
    return ApiResponseDto.ok(prompt, 'Prompt created successfully');
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all prompts and their latest versions' })
  async findAll(@Query('project') project?: string) {
    const prompts = await this.promptsService.findAll(project);
    return ApiResponseDto.ok(prompts, 'Prompts retrieved successfully');
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a prompt by ID or slug' })
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    const prompt = await this.promptsService.findOne(idOrSlug);
    return ApiResponseDto.ok(prompt, 'Prompt retrieved successfully');
  }

  @Post(':idOrSlug/versions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish an immutable new version for a prompt' })
  async addVersion(
    @Param('idOrSlug') idOrSlug: string,
    @Body() versionDto: CreatePromptVersionDto,
    @Req() req: any,
  ) {
    const updated = await this.promptsService.addVersion(idOrSlug, versionDto, req.user);
    return ApiResponseDto.ok(updated, `Version ${versionDto.version} published`);
  }
}
