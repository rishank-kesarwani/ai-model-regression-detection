import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EvaluatorRegistry } from '@ai-model-regression/evaluator';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { PublicReadOnly } from '../auth/decorators/auth-policy.decorator';

@ApiTags('Metrics Catalog')
@Controller('metrics')
@UseGuards(OptionalJwtAuthGuard)
export class MetricsController {
  private registry = new EvaluatorRegistry();

  @PublicReadOnly()
  @Get()
  @ApiOperation({ summary: 'Get all available evaluation metrics, categories, directions, and units (Demo read-only access)' })
  getAllMetrics() {
    const evaluators = this.registry.getAll();
    const metrics = evaluators.map((e) => ({
      name: e.metricName,
      category: e.category,
      direction: e.direction,
      unit: e.unit,
      isAiJudgeBased: e.isAiJudgeBased,
    }));
    return ApiResponseDto.ok(metrics, 'Available metrics catalog retrieved');
  }
}
