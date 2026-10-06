import { ConfidenceInterval } from '../types/stats.types';
import { calculateDescriptiveStats } from './descriptive';

export function calculateConfidenceInterval(
  values: number[],
  confidenceLevel: number = 0.95,
): ConfidenceInterval {
  const stats = calculateDescriptiveStats(values);
  if (stats.count < 2 || stats.stdDev === 0) {
    return {
      lower: stats.mean,
      upper: stats.mean,
      confidenceLevel,
      marginOfError: 0,
    };
  }

  // Z critical value approximation for standard confidence levels
  let zScore = 1.96; // 95%
  if (confidenceLevel >= 0.99) zScore = 2.576;
  else if (confidenceLevel >= 0.90) zScore = 1.645;
  else if (confidenceLevel >= 0.80) zScore = 1.282;

  const standardError = stats.stdDev / Math.sqrt(stats.count);
  const marginOfError = zScore * standardError;

  return {
    lower: Math.round((stats.mean - marginOfError) * 10000) / 10000,
    upper: Math.round((stats.mean + marginOfError) * 10000) / 10000,
    confidenceLevel,
    marginOfError: Math.round(marginOfError * 10000) / 10000,
  };
}
