import { HypothesisTestResult } from '../types/stats.types';
import { calculateDescriptiveStats } from './descriptive';

/**
 * Welch's Two-Sample t-test for unequal variances and sample sizes
 */
export function calculateStatisticalSignificance(
  baselineValues: number[],
  candidateValues: number[],
  alpha: number = 0.05,
): HypothesisTestResult {
  const bStats = calculateDescriptiveStats(baselineValues);
  const cStats = calculateDescriptiveStats(candidateValues);

  if (bStats.count < 3 || cStats.count < 3) {
    return {
      tStatistic: 0,
      pValue: 1.0,
      isSignificant: false,
      degreesOfFreedom: 0,
      alpha,
    };
  }

  const varB = bStats.variance / bStats.count;
  const varC = cStats.variance / cStats.count;
  const standardErrorDiff = Math.sqrt(varB + varC);

  if (standardErrorDiff === 0) {
    const isDifferent = bStats.mean !== cStats.mean;
    return {
      tStatistic: isDifferent ? 999 : 0,
      pValue: isDifferent ? 0.0001 : 1.0,
      isSignificant: isDifferent,
      degreesOfFreedom: bStats.count + cStats.count - 2,
      alpha,
    };
  }

  const tStat = (cStats.mean - bStats.mean) / standardErrorDiff;

  // Welch-Satterthwaite equation for degrees of freedom
  const num = Math.pow(varB + varC, 2);
  const denom =
    Math.pow(varB, 2) / (bStats.count - 1) + Math.pow(varC, 2) / (cStats.count - 1);
  const df = denom > 0 ? num / denom : 1;

  // P-value approximation using normal CDF approximation for t-stat
  const pVal = approximateTwoTailedPValue(Math.abs(tStat), df);

  return {
    tStatistic: Math.round(tStat * 1000) / 1000,
    pValue: Math.round(pVal * 10000) / 10000,
    isSignificant: pVal < alpha,
    degreesOfFreedom: Math.round(df * 10) / 10,
    alpha,
  };
}

function approximateTwoTailedPValue(t: number, df: number): number {
  if (t === 0) return 1.0;
  // Approximation using error function
  const x = t / Math.sqrt(2);
  const cdf = 0.5 * (1 + erf(x));
  const oneTailed = 1 - cdf;
  return Math.min(1.0, Math.max(0.0, 2 * oneTailed));
}

function erf(x: number): number {
  // Abramowitz and Stegun formula 7.1.26
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}
