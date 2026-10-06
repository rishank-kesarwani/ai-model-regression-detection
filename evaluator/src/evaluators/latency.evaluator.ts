import { BaseMetricEvaluator, EvaluatorContext } from './base.evaluator';
import { MetricCategory, MetricDirection, StandardMetricName, SingleMetricResult } from '../types/metric.types';

export class LatencyEvaluator extends BaseMetricEvaluator {
  readonly metricName = StandardMetricName.LATENCY_MS;
  readonly category = MetricCategory.PERFORMANCE;
  readonly direction = MetricDirection.LOWER_IS_BETTER;
  readonly unit = 'ms';

  evaluate(context: EvaluatorContext): SingleMetricResult {
    const latency = context.latencyMs ?? 0;
    return this.createResult(
      latency,
      `Observed latency: ${latency} ms`,
      { latencyMs: latency },
    );
  }
}
