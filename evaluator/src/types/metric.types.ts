export enum MetricCategory {
  QUALITY = 'QUALITY',
  RELIABILITY = 'RELIABILITY',
  PERFORMANCE = 'PERFORMANCE',
  COST = 'COST',
  STRUCTURED_OUTPUT = 'STRUCTURED_OUTPUT',
  SAFETY = 'SAFETY',
  RETRIEVAL = 'RETRIEVAL',
  TOOL_USE = 'TOOL_USE',
  CUSTOM = 'CUSTOM',
}

export enum MetricDirection {
  HIGHER_IS_BETTER = 'HIGHER_IS_BETTER',
  LOWER_IS_BETTER = 'LOWER_IS_BETTER',
}

export enum StandardMetricName {
  EXACT_MATCH = 'exact_match',
  STRING_SIMILARITY = 'string_similarity',
  JSON_SCHEMA_VALIDITY = 'json_schema_validity',
  JSON_PARSE_SUCCESS = 'json_parse_success',
  REQUIRED_FIELD_VALIDITY = 'required_field_validity',
  LATENCY_MS = 'latency_ms',
  P50_LATENCY = 'p50_latency',
  P95_LATENCY = 'p95_latency',
  P99_LATENCY = 'p99_latency',
  PROMPT_TOKENS = 'prompt_tokens',
  COMPLETION_TOKENS = 'completion_tokens',
  TOTAL_TOKENS = 'total_tokens',
  ESTIMATED_COST_USD = 'estimated_cost_usd',
  SUCCESS_RATE = 'success_rate',
  ERROR_RATE = 'error_rate',
  TIMEOUT_RATE = 'timeout_rate',
  AI_JUDGE_SCORE = 'ai_judge_score',
  CORRECTNESS_SCORE = 'correctness_score',
  RELEVANCE_SCORE = 'relevance_score',
  COMPLETENESS_SCORE = 'completeness_score',
  SAFETY_POLICY_VIOLATION = 'safety_policy_violation',
  HALLUCINATION_SCORE = 'hallucination_score',
}

export interface MetricDefinition {
  name: string;
  category: MetricCategory;
  direction: MetricDirection;
  unit: string;
  description: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  isAiJudgeBased?: boolean;
}

export interface SingleMetricResult {
  metricName: string;
  category: MetricCategory;
  direction: MetricDirection;
  value: number;
  unit: string;
  isAiJudgeBased?: boolean;
  metadata?: Record<string, any>;
  explanation?: string;
}

export interface MetricSummary {
  metricName: string;
  category: MetricCategory;
  direction: MetricDirection;
  unit: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  p50: number;
  p95: number;
  p99: number;
  sampleSize: number;
  isAiJudgeBased?: boolean;
}
