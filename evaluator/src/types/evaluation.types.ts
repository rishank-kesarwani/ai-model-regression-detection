import { EvaluationCase } from './dataset.types';
import { SingleMetricResult, MetricSummary } from './metric.types';
import { RegressionDecision, RegressionSummary } from './regression.types';

export enum EvaluationRunStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface ModelPricing {
  provider: string; // e.g. "openai", "anthropic", "google", "mistral", "meta"
  model: string; // e.g. "gpt-4o", "claude-3-5-sonnet", "gemini-1.5-pro"
  inputTokenCostPerMillion: number; // in USD
  outputTokenCostPerMillion: number; // in USD
  currency: string; // "USD"
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface ModelConfiguration {
  provider: string;
  model: string;
  modelVersion?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  systemPromptVersion?: string;
  promptVersion?: string;
  applicationVersion?: string;
  extraParams?: Record<string, any>;
}

export interface PromptVersion {
  promptId: string;
  version: string;
  template: string;
  systemTemplate?: string;
  contentHash: string;
  createdAt: Date | string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CaseExecutionResult {
  caseId: string;
  input: string;
  expectedOutput?: string;
  actualOutput: string;
  error?: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  isSuccess: boolean;
  metrics: Record<string, SingleMetricResult>;
  metadata?: Record<string, any>;
}

export interface EvaluationRunReproducibility {
  datasetId: string;
  datasetVersion: string;
  modelConfig: ModelConfiguration;
  promptVersion?: PromptVersion;
  evaluatorVersion: string;
  applicationVersion?: string;
  timestamp: string;
  enabledMetrics: string[];
  pricingSnapshot?: ModelPricing;
}

export interface EvaluationRunSummary {
  id: string;
  project: string;
  datasetId: string;
  datasetVersion: string;
  model: string;
  modelVersion?: string;
  promptVersion?: string;
  applicationVersion?: string;
  baselineRunId?: string;
  status: EvaluationRunStatus;
  startedAt: string;
  completedAt?: string;
  totalCases: number;
  processedCases: number;
  failedCases: number;
  metricsSummary: Record<string, MetricSummary>;
  decision?: RegressionDecision;
  regressionSummary?: RegressionSummary;
  reproducibility: EvaluationRunReproducibility;
}
