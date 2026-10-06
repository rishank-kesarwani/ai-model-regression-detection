import { BaseMetricEvaluator, EvaluatorContext } from './base.evaluator';
import { MetricCategory, MetricDirection, StandardMetricName, SingleMetricResult } from '../types/metric.types';
import { ModelPricing } from '../types/evaluation.types';

export class CostEvaluator extends BaseMetricEvaluator {
  readonly metricName = StandardMetricName.ESTIMATED_COST_USD;
  readonly category = MetricCategory.COST;
  readonly direction = MetricDirection.LOWER_IS_BETTER;
  readonly unit = 'USD';

  evaluate(context: EvaluatorContext): SingleMetricResult {
    if (context.estimatedCostUsd !== undefined && context.estimatedCostUsd !== null) {
      return this.createResult(
        context.estimatedCostUsd,
        `Cost computed from run: $${context.estimatedCostUsd.toFixed(6)}`,
        { estimatedCostUsd: context.estimatedCostUsd },
      );
    }

    const pricing: ModelPricing | undefined = context.pricingSnapshot;
    const promptTokens = context.promptTokens ?? Math.ceil((context.evaluationCase.input.length) / 4);
    const completionTokens = context.completionTokens ?? Math.ceil((context.modelOutput?.length || 0) / 4);

    let cost = 0;
    if (pricing) {
      const inputCost = (promptTokens / 1_000_000) * pricing.inputTokenCostPerMillion;
      const outputCost = (completionTokens / 1_000_000) * pricing.outputTokenCostPerMillion;
      cost = inputCost + outputCost;
    } else {
      // Default fallback cost estimate ($2.50 per 1M in, $10 per 1M out)
      const inputCost = (promptTokens / 1_000_000) * 2.5;
      const outputCost = (completionTokens / 1_000_000) * 10.0;
      cost = inputCost + outputCost;
    }

    return this.createResult(
      cost,
      `Estimated cost: $${cost.toFixed(6)} USD`,
      {
        promptTokens,
        completionTokens,
        calculatedCostUsd: cost,
        pricingUsed: pricing || 'default-fallback',
      },
    );
  }
}
