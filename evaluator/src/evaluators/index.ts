import { MetricEvaluator } from './base.evaluator';
import { ExactMatchEvaluator } from './exact-match.evaluator';
import { JSONSchemaEvaluator } from './json-schema.evaluator';
import { StringSimilarityEvaluator } from './string-similarity.evaluator';
import { LatencyEvaluator } from './latency.evaluator';
import { TokenUsageEvaluator } from './token-usage.evaluator';
import { CostEvaluator } from './cost.evaluator';
import { LLMJudgeEvaluator } from './llm-judge.evaluator';
import { SafetyEvaluator } from './safety.evaluator';
import { CustomMetricEvaluator, CustomEvaluatorConfig } from './custom.evaluator';
import { StandardMetricName } from '../types/metric.types';

export * from './base.evaluator';
export * from './exact-match.evaluator';
export * from './json-schema.evaluator';
export * from './string-similarity.evaluator';
export * from './latency.evaluator';
export * from './token-usage.evaluator';
export * from './cost.evaluator';
export * from './llm-judge.evaluator';
export * from './safety.evaluator';
export * from './custom.evaluator';

export class EvaluatorRegistry {
  private evaluators: Map<string, MetricEvaluator> = new Map();

  constructor() {
    this.registerStandardEvaluators();
  }

  private registerStandardEvaluators() {
    this.register(new ExactMatchEvaluator());
    this.register(new JSONSchemaEvaluator());
    this.register(new StringSimilarityEvaluator());
    this.register(new LatencyEvaluator());
    this.register(new TokenUsageEvaluator());
    this.register(new CostEvaluator());
    this.register(new LLMJudgeEvaluator());
    this.register(new SafetyEvaluator());
  }

  public register(evaluator: MetricEvaluator): void {
    this.evaluators.set(evaluator.metricName.toLowerCase(), evaluator);
  }

  public registerCustom(config: CustomEvaluatorConfig): void {
    const evaluator = new CustomMetricEvaluator(config);
    this.register(evaluator);
  }

  public get(metricName: string): MetricEvaluator | undefined {
    return this.evaluators.get(metricName.toLowerCase());
  }

  public getAll(): MetricEvaluator[] {
    return Array.from(this.evaluators.values());
  }

  public getAvailableMetricNames(): string[] {
    return Array.from(this.evaluators.keys());
  }
}
