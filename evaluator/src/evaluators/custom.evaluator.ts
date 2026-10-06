import { BaseMetricEvaluator, EvaluatorContext } from './base.evaluator';
import { MetricCategory, MetricDirection, SingleMetricResult } from '../types/metric.types';

export interface CustomEvaluatorConfig {
  metricName: string;
  category?: MetricCategory;
  direction?: MetricDirection;
  unit?: string;
  description?: string;
  expectedPattern?: string; // Regex pattern
  forbiddenPattern?: string; // Regex pattern
  minLength?: number;
  maxLength?: number;
  customJsCode?: string;
}

export class CustomMetricEvaluator extends BaseMetricEvaluator {
  readonly metricName: string;
  readonly category: MetricCategory;
  readonly direction: MetricDirection;
  readonly unit: string;
  private readonly config: CustomEvaluatorConfig;

  constructor(config: CustomEvaluatorConfig) {
    super();
    this.config = config;
    this.metricName = config.metricName || 'custom_metric';
    this.category = config.category || MetricCategory.CUSTOM;
    this.direction = config.direction || MetricDirection.HIGHER_IS_BETTER;
    this.unit = config.unit || 'score';
  }

  evaluate(context: EvaluatorContext): SingleMetricResult {
    const output = String(context.modelOutput || '');

    // Pattern matching check
    if (this.config.expectedPattern) {
      const reg = new RegExp(this.config.expectedPattern, 'i');
      const matches = reg.test(output);
      return this.createResult(
        matches ? 1.0 : 0.0,
        matches ? `Matched required pattern ${this.config.expectedPattern}` : `Did not match pattern ${this.config.expectedPattern}`,
        { pattern: this.config.expectedPattern, matched: matches },
      );
    }

    if (this.config.forbiddenPattern) {
      const reg = new RegExp(this.config.forbiddenPattern, 'i');
      const matches = reg.test(output);
      return this.createResult(
        matches ? 0.0 : 1.0,
        matches ? `Contains forbidden pattern ${this.config.forbiddenPattern}` : `Free of forbidden pattern`,
        { pattern: this.config.forbiddenPattern, violated: matches },
      );
    }

    // Length boundary check
    if (this.config.minLength !== undefined || this.config.maxLength !== undefined) {
      const min = this.config.minLength ?? 0;
      const max = this.config.maxLength ?? Infinity;
      const valid = output.length >= min && output.length <= max;
      return this.createResult(
        valid ? 1.0 : 0.0,
        valid ? `Length ${output.length} within limits [${min}, ${max}]` : `Length ${output.length} out of bounds [${min}, ${max}]`,
        { length: output.length, min, max, valid },
      );
    }

    // Safe execution of custom calculation if defined
    if (this.config.customJsCode) {
      try {
        const fn = new Function('output', 'expected', 'metadata', this.config.customJsCode);
        const res = fn(output, context.evaluationCase.expectedOutput, context.evaluationCase.metadata);
        const score = typeof res === 'number' ? res : res ? 1.0 : 0.0;
        return this.createResult(score, 'Custom JS metric evaluation completed', { rawResult: res });
      } catch (err: any) {
        return this.createResult(0.0, `Custom evaluation error: ${err.message}`, { error: err.message });
      }
    }

    return this.createResult(1.0, 'Custom evaluator passed (default)');
  }
}
