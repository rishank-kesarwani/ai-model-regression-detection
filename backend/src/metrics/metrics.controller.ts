import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EvaluatorRegistry } from '@ai-model-regression/evaluator';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Metrics Catalog')
@Controller('metrics')
export class MetricsController {
  private registry = new EvaluatorRegistry();

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all available evaluation metrics, categories, directions, and units' })
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
