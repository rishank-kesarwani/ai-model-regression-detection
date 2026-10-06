import { Controller, Post, Get, Body, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegressionService } from './regression.service';
import { RegressionCheckDto, RegressionCheckResponseDto } from './dto/regression-check.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Regression Engine & Integration Contract')
@Controller('regression')
@UseGuards(OptionalJwtAuthGuard)
export class RegressionController {
  constructor(private readonly regressionService: RegressionService) {}

  @Public()
  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PR Review & CI Regression Check Contract',
    description: 'Endpoint consumed by ai-pr-review-platform and CI pipelines to evaluate model/prompt releases against baselines.',
  })
  @ApiResponse({
    status: 200,
    description: 'Regression decision calculated',
    type: RegressionCheckResponseDto,
  })
  async checkRegression(@Body() dto: RegressionCheckDto, @Req() req: any) {
    const result = await this.regressionService.checkRegression(dto, req.user);
    return ApiResponseDto.ok(result, 'Regression check completed');
  }

  @Public()
  @Get('history')
  @ApiOperation({ summary: 'Get historical regression incidents' })
  async getRegressions(
    @Query('project') project?: string,
    @Query('limit') limit?: number,
  ) {
    const list = await this.regressionService.getRecentRegressions(project, limit);
    return ApiResponseDto.ok(list, 'Recent regressions retrieved');
  }
}
