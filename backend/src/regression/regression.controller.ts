import { Controller, Post, Get, Body, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { RegressionService } from './regression.service';
import { RegressionCheckDto, RegressionCheckResponseDto } from './dto/regression-check.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { RequireServiceAuth, PublicReadOnly } from '../auth/decorators/auth-policy.decorator';

@ApiTags('Regression Engine & Integration Contract')
@Controller('regression')
@UseGuards(OptionalJwtAuthGuard)
export class RegressionController {
  constructor(private readonly regressionService: RegressionService) {}

  @RequireServiceAuth({ allowUser: true })
  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'x-api-key',
    description: 'Internal Service API Key (e.g. for ai-pr-review-platform)',
    required: false,
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'PR Review & CI Regression Check Contract',
    description: 'Protected endpoint consumed by ai-pr-review-platform, CI pipelines, or authenticated operators.',
  })
  @ApiResponse({
    status: 200,
    description: 'Regression decision calculated',
    type: RegressionCheckResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized service API key or token' })
  @ApiResponse({ status: 403, description: 'Forbidden project scope for service' })
  async checkRegression(@Body() dto: RegressionCheckDto, @Req() req: any) {
    const result = await this.regressionService.checkRegression(dto, req.user);
    return ApiResponseDto.ok(result, 'Regression check completed');
  }

  @PublicReadOnly()
  @Get('history')
  @ApiOperation({ summary: 'Get historical regression incidents (Demo read-only access)' })
  async getRegressions(
    @Query('project') project?: string,
    @Query('limit') limit?: number,
  ) {
    const list = await this.regressionService.getRecentRegressions(project, limit);
    return ApiResponseDto.ok(list, 'Recent regressions retrieved');
  }
}
