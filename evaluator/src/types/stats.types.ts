export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  mode?: number;
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidenceLevel: number; // e.g. 0.95 for 95%
  marginOfError: number;
}

export interface HypothesisTestResult {
  tStatistic: number;
  pValue: number;
  isSignificant: boolean;
  degreesOfFreedom: number;
  alpha: number;
}
