import {
  RegressionPolicy,
  RegressionPolicyRule,
  RegressionSeverity,
  RegressionType,
} from '../types/regression.types';
import {
  MetricCategory,
  MetricDirection,
  StandardMetricName,
} from '../types/metric.types';

export const DEFAULT_REGRESSION_POLICY: RegressionPolicy = {
  id: 'default-production-policy',
  name: 'Standard Production Regression Policy',
  project: 'default',
  isDefault: true,
  rules: [
    {
      metricName: StandardMetricName.EXACT_MATCH,
      category: MetricCategory.QUALITY,
      regressionType: RegressionType.QUALITY_REGRESSION,
      direction: MetricDirection.HIGHER_IS_BETTER,
      warnThresholdPercent: -2.0,
      failThresholdPercent: -5.0,
      severityIfWarn: RegressionSeverity.MEDIUM,
      severityIfFail: RegressionSeverity.HIGH,
      minSampleSize: 5,
    },
    {
      metricName: StandardMetricName.STRING_SIMILARITY,
      category: MetricCategory.QUALITY,
      regressionType: RegressionType.QUALITY_REGRESSION,
      direction: MetricDirection.HIGHER_IS_BETTER,
      warnThresholdPercent: -3.0,
      failThresholdPercent: -7.0,
      severityIfWarn: RegressionSeverity.LOW,
      severityIfFail: RegressionSeverity.HIGH,
      minSampleSize: 5,
    },
    {
      metricName: StandardMetricName.AI_JUDGE_SCORE,
      category: MetricCategory.QUALITY,
      regressionType: RegressionType.QUALITY_REGRESSION,
      direction: MetricDirection.HIGHER_IS_BETTER,
      warnThresholdPercent: -2.5,
      failThresholdPercent: -5.0,
      severityIfWarn: RegressionSeverity.MEDIUM,
      severityIfFail: RegressionSeverity.HIGH,
      minSampleSize: 5,
    },
    {
      metricName: StandardMetricName.JSON_SCHEMA_VALIDITY,
      category: MetricCategory.STRUCTURED_OUTPUT,
      regressionType: RegressionType.STRUCTURED_OUTPUT_REGRESSION,
      direction: MetricDirection.HIGHER_IS_BETTER,
      warnThresholdPercent: -1.0,
      failThresholdPercent: -3.0,
      severityIfWarn: RegressionSeverity.HIGH,
      severityIfFail: RegressionSeverity.CRITICAL,
      minSampleSize: 3,
    },
    {
      metricName: StandardMetricName.LATENCY_MS,
      category: MetricCategory.PERFORMANCE,
      regressionType: RegressionType.LATENCY_REGRESSION,
      direction: MetricDirection.LOWER_IS_BETTER,
      warnThresholdPercent: 15.0,
      failThresholdPercent: 30.0,
      severityIfWarn: RegressionSeverity.LOW,
      severityIfFail: RegressionSeverity.MEDIUM,
      minSampleSize: 5,
    },
    {
      metricName: StandardMetricName.TOTAL_TOKENS,
      category: MetricCategory.COST,
      regressionType: RegressionType.COST_REGRESSION,
      direction: MetricDirection.LOWER_IS_BETTER,
      warnThresholdPercent: 20.0,
      failThresholdPercent: 40.0,
      severityIfWarn: RegressionSeverity.LOW,
      severityIfFail: RegressionSeverity.MEDIUM,
      minSampleSize: 5,
    },
    {
      metricName: StandardMetricName.ESTIMATED_COST_USD,
      category: MetricCategory.COST,
      regressionType: RegressionType.COST_REGRESSION,
      direction: MetricDirection.LOWER_IS_BETTER,
      warnThresholdPercent: 20.0,
      failThresholdPercent: 40.0,
      severityIfWarn: RegressionSeverity.MEDIUM,
      severityIfFail: RegressionSeverity.HIGH,
      minSampleSize: 5,
    },
    {
      metricName: StandardMetricName.SAFETY_POLICY_VIOLATION,
      category: MetricCategory.SAFETY,
      regressionType: RegressionType.SAFETY_REGRESSION,
      direction: MetricDirection.LOWER_IS_BETTER,
      warnThresholdPercent: 0.1, // Any increase in violations is critical
      failThresholdPercent: 1.0,
      severityIfWarn: RegressionSeverity.CRITICAL,
      severityIfFail: RegressionSeverity.CRITICAL,
      minSampleSize: 1,
    },
    {
      metricName: StandardMetricName.ERROR_RATE,
      category: MetricCategory.RELIABILITY,
      regressionType: RegressionType.RELIABILITY_REGRESSION,
      direction: MetricDirection.LOWER_IS_BETTER,
      warnThresholdPercent: 2.0,
      failThresholdPercent: 5.0,
      severityIfWarn: RegressionSeverity.HIGH,
      severityIfFail: RegressionSeverity.CRITICAL,
      minSampleSize: 3,
    },
  ],
};

export class PolicyEngine {
  private policy: RegressionPolicy;

  constructor(policy: RegressionPolicy = DEFAULT_REGRESSION_POLICY) {
    this.policy = policy;
  }

  public getRuleForMetric(
    metricName: string,
    category: MetricCategory = MetricCategory.CUSTOM,
    direction: MetricDirection = MetricDirection.HIGHER_IS_BETTER,
  ): RegressionPolicyRule {
    const matched = this.policy.rules.find(
      r => r.metricName.toLowerCase() === metricName.toLowerCase(),
    );
    if (matched) return matched;

    // Fallback default rule per category or direction
    const isHigherBetter = direction === MetricDirection.HIGHER_IS_BETTER;
    return {
      metricName,
      category,
      regressionType: this.mapCategoryToRegressionType(category),
      direction,
      warnThresholdPercent: isHigherBetter ? -5.0 : 15.0,
      failThresholdPercent: isHigherBetter ? -10.0 : 30.0,
      severityIfWarn: RegressionSeverity.LOW,
      severityIfFail: RegressionSeverity.MEDIUM,
      minSampleSize: 5,
    };
  }

  private mapCategoryToRegressionType(category: MetricCategory): RegressionType {
    switch (category) {
      case MetricCategory.QUALITY:
        return RegressionType.QUALITY_REGRESSION;
      case MetricCategory.PERFORMANCE:
        return RegressionType.LATENCY_REGRESSION;
      case MetricCategory.COST:
        return RegressionType.COST_REGRESSION;
      case MetricCategory.SAFETY:
        return RegressionType.SAFETY_REGRESSION;
      case MetricCategory.STRUCTURED_OUTPUT:
        return RegressionType.STRUCTURED_OUTPUT_REGRESSION;
      case MetricCategory.RELIABILITY:
        return RegressionType.RELIABILITY_REGRESSION;
      case MetricCategory.RETRIEVAL:
        return RegressionType.RETRIEVAL_REGRESSION;
      case MetricCategory.TOOL_USE:
        return RegressionType.TOOL_USE_REGRESSION;
      default:
        return RegressionType.CUSTOM_REGRESSION;
    }
  }
}
