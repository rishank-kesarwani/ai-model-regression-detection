import { BaseMetricEvaluator, EvaluatorContext } from './base.evaluator';
import { MetricCategory, MetricDirection, StandardMetricName, SingleMetricResult } from '../types/metric.types';

export class TokenUsageEvaluator extends BaseMetricEvaluator {
  readonly metricName = StandardMetricName.TOTAL_TOKENS;
  readonly category = MetricCategory.COST;
  readonly direction = MetricDirection.LOWER_IS_BETTER;
  readonly unit = 'tokens';

  evaluate(context: EvaluatorContext): SingleMetricResult {
    const promptTokens = context.promptTokens ?? Math.ceil((context.evaluationCase.input.length) / 4);
    const completionTokens = context.completionTokens ?? Math.ceil((context.modelOutput?.length || 0) / 4);
    const totalTokens = context.totalTokens ?? (promptTokens + completionTokens);

    return this.createResult(
      totalTokens,
      `Total tokens: ${totalTokens} (Prompt: ${promptTokens}, Completion: ${completionTokens})`,
      {
        promptTokens,
        completionTokens,
        totalTokens,
      },
    );
  }
}
