import { BaseMetricEvaluator, EvaluatorContext } from './base.evaluator';
import { MetricCategory, MetricDirection, StandardMetricName, SingleMetricResult } from '../types/metric.types';

export class ExactMatchEvaluator extends BaseMetricEvaluator {
  readonly metricName = StandardMetricName.EXACT_MATCH;
  readonly category = MetricCategory.QUALITY;
  readonly direction = MetricDirection.HIGHER_IS_BETTER;
  readonly unit = 'ratio';

  evaluate(context: EvaluatorContext): SingleMetricResult {
    const expected = context.evaluationCase.expectedOutput;
    const actual = context.modelOutput;

    if (expected === undefined || expected === null) {
      return this.createResult(1.0, 'No expected output defined; default match');
    }

    const trimmedExpected = String(expected).trim();
    const trimmedActual = String(actual || '').trim();

    const isMatch = trimmedExpected === trimmedActual;
    const isCaseInsensitiveMatch = trimmedExpected.toLowerCase() === trimmedActual.toLowerCase();

    return this.createResult(
      isMatch ? 1.0 : isCaseInsensitiveMatch ? 0.9 : 0.0,
      isMatch
        ? 'Exact match achieved'
        : isCaseInsensitiveMatch
        ? 'Case-insensitive match achieved'
        : 'Output differed from expected string',
      {
        isExact: isMatch,
        isCaseInsensitive: isCaseInsensitiveMatch,
        expectedLength: trimmedExpected.length,
        actualLength: trimmedActual.length,
      },
    );
  }
}
