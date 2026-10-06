import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GitHubService } from './github.service';
import { GitHubEvaluationDto } from './dto/github-eval.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('GitHub Integration')
@Controller('github')
@UseGuards(OptionalJwtAuthGuard)
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @Public()
  @Post('evaluations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger evaluation for a GitHub PR / commit',
    description: 'Enqueues and processes an evaluation for a PR commit, returning regression status.',
  })
  @ApiResponse({ status: 200, description: 'Evaluation run triggered and evaluated' })
  async triggerEvaluation(@Body() dto: GitHubEvaluationDto, @Req() req: any) {
    const result = await this.githubService.triggerPREvaluation(dto, req.user);
    return ApiResponseDto.ok(result, 'GitHub PR evaluation completed');
  }
}
