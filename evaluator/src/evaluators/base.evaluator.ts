import { EvaluationCase } from '../types/dataset.types';
import { SingleMetricResult, MetricCategory, MetricDirection } from '../types/metric.types';

export interface EvaluatorContext {
  modelOutput: string;
  evaluationCase: EvaluationCase;
  latencyMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  modelConfig?: Record<string, any>;
  pricingSnapshot?: any;
  customParameters?: Record<string, any>;
  judgeProvider?: (prompt: string) => Promise<string>;
}

export interface MetricEvaluator {
  readonly metricName: string;
  readonly category: MetricCategory;
  readonly direction: MetricDirection;
  readonly unit: string;
  readonly isAiJudgeBased: boolean;

  evaluate(context: EvaluatorContext): Promise<SingleMetricResult> | SingleMetricResult;
}

export abstract class BaseMetricEvaluator implements MetricEvaluator {
  abstract readonly metricName: string;
  abstract readonly category: MetricCategory;
  abstract readonly direction: MetricDirection;
  abstract readonly unit: string;
  readonly isAiJudgeBased: boolean = false;

  abstract evaluate(context: EvaluatorContext): Promise<SingleMetricResult> | SingleMetricResult;

  protected createResult(
    value: number,
    explanation?: string,
    metadata?: Record<string, any>,
  ): SingleMetricResult {
    return {
      metricName: this.metricName,
      category: this.category,
      direction: this.direction,
      value: Number.isFinite(value) ? Math.round(value * 10000) / 10000 : 0,
      unit: this.unit,
      isAiJudgeBased: this.isAiJudgeBased,
      explanation,
      metadata,
    };
  }
}
