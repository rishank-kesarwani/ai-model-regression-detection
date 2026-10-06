import { DescriptiveStats } from '../types/stats.types';

export function calculateDescriptiveStats(values: number[]): DescriptiveStats {
  if (!values || values.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      variance: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  const median = getPercentile(sorted, 50);
  const min = sorted[0];
  const max = sorted[count - 1];

  const variance =
    count > 1
      ? sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  return {
    count,
    mean: round(mean, 4),
    median: round(median, 4),
    variance: round(variance, 6),
    stdDev: round(stdDev, 4),
    min: round(min, 4),
    max: round(max, 4),
    p25: round(getPercentile(sorted, 25), 4),
    p50: round(getPercentile(sorted, 50), 4),
    p75: round(getPercentile(sorted, 75), 4),
    p90: round(getPercentile(sorted, 90), 4),
    p95: round(getPercentile(sorted, 95), 4),
    p99: round(getPercentile(sorted, 99), 4),
  };
}

export function getPercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (percentile <= 0) return sortedValues[0];
  if (percentile >= 100) return sortedValues[sortedValues.length - 1];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
