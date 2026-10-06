import { MetricCategory, MetricDirection } from './metric.types';

export enum RegressionDecision {
  PASS = 'PASS',
  WARN = 'WARN',
  FAIL = 'FAIL',
}

export enum RegressionSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RegressionType {
  QUALITY_REGRESSION = 'QUALITY_REGRESSION',
  LATENCY_REGRESSION = 'LATENCY_REGRESSION',
  COST_REGRESSION = 'COST_REGRESSION',
  RELIABILITY_REGRESSION = 'RELIABILITY_REGRESSION',
  SAFETY_REGRESSION = 'SAFETY_REGRESSION',
  STRUCTURED_OUTPUT_REGRESSION = 'STRUCTURED_OUTPUT_REGRESSION',
  RETRIEVAL_REGRESSION = 'RETRIEVAL_REGRESSION',
  TOOL_USE_REGRESSION = 'TOOL_USE_REGRESSION',
  CUSTOM_REGRESSION = 'CUSTOM_REGRESSION',
}

export interface RegressionPolicyRule {
  metricName: string;
  category: MetricCategory;
  regressionType: RegressionType;
  direction: MetricDirection;
  warnThresholdPercent: number; // e.g. -2 for accuracy (2% drop) or +15 for latency (15% increase)
  failThresholdPercent: number; // e.g. -5 for accuracy (5% drop) or +30 for latency (30% increase)
  warnAbsoluteThreshold?: number;
  failAbsoluteThreshold?: number;
  severityIfWarn: RegressionSeverity;
  severityIfFail: RegressionSeverity;
  minSampleSize?: number;
}

export interface RegressionPolicy {
  id: string;
  name: string;
  project: string;
  isDefault?: boolean;
  rules: RegressionPolicyRule[];
  defaultRuleForCategory?: Partial<Record<MetricCategory, Partial<RegressionPolicyRule>>>;
}

export interface MetricRegression {
  metricName: string;
  category: MetricCategory;
  regressionType: RegressionType;
  direction: MetricDirection;
  baselineValue: number;
  candidateValue: number;
  delta: number; // candidate - baseline
  relativeDelta: number; // (candidate - baseline) / baseline
  relativeDeltaPercent: number; // relativeDelta * 100
  warnThresholdPercent: number;
  failThresholdPercent: number;
  decision: RegressionDecision; // PASS, WARN, FAIL
  severity: RegressionSeverity;
  isStatisticallySignificant?: boolean;
  confidenceInterval?: [number, number];
  explanation: string;
  unit: string;
}

export interface RegressionSummary {
  overallDecision: RegressionDecision;
  totalMetricsCompared: number;
  passedCount: number;
  warnCount: number;
  failedCount: number;
  regressions: MetricRegression[];
  topRegressions: MetricRegression[];
  evaluatedAt: string;
  policyUsed: string;
}

export interface BaselineComparisonRequest {
  baselineRunId: string;
  candidateRunId: string;
  policyId?: string;
  customPolicy?: RegressionPolicy;
}
