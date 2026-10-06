import {
  MetricRegression,
  RegressionDecision,
  RegressionPolicy,
  RegressionPolicyRule,
  RegressionSeverity,
  RegressionSummary,
} from '../types/regression.types';
import { MetricSummary, MetricDirection } from '../types/metric.types';
import { PolicyEngine, DEFAULT_REGRESSION_POLICY } from './policy-engine';
import { calculateStatisticalSignificance } from '../statistics/significance';
import { calculateConfidenceInterval } from '../statistics/confidence';

export interface CompareOptions {
  policy?: RegressionPolicy;
  rawSampleData?: {
    baselineSamples?: Record<string, number[]>;
    candidateSamples?: Record<string, number[]>;
  };
}

export class RegressionEngine {
  private policyEngine: PolicyEngine;

  constructor(policy?: RegressionPolicy) {
    this.policyEngine = new PolicyEngine(policy || DEFAULT_REGRESSION_POLICY);
  }

  public compareMetric(
    metricName: string,
    baselineSummary: MetricSummary,
    candidateSummary: MetricSummary,
    ruleOverride?: RegressionPolicyRule,
    rawBaselineSamples?: number[],
    rawCandidateSamples?: number[],
  ): MetricRegression {
    const rule =
      ruleOverride ||
      this.policyEngine.getRuleForMetric(
        metricName,
        candidateSummary.category,
        candidateSummary.direction,
      );

    const baselineVal = baselineSummary.mean;
    const candidateVal = candidateSummary.mean;

    const delta = Math.round((candidateVal - baselineVal) * 10000) / 10000;
    const relativeDelta =
      Math.abs(baselineVal) > 0.00001
        ? (candidateVal - baselineVal) / Math.abs(baselineVal)
        : candidateVal - baselineVal;
    const relativeDeltaPercent = Math.round(relativeDelta * 10000) / 100;

    let decision = RegressionDecision.PASS;
    let severity = RegressionSeverity.INFO;

    if (rule.direction === MetricDirection.HIGHER_IS_BETTER) {
      // Negative delta means quality drop
      if (relativeDeltaPercent <= rule.failThresholdPercent) {
        decision = RegressionDecision.FAIL;
        severity = rule.severityIfFail;
      } else if (relativeDeltaPercent <= rule.warnThresholdPercent) {
        decision = RegressionDecision.WARN;
        severity = rule.severityIfWarn;
      }
    } else {
      // LOWER_IS_BETTER: Positive delta means latency/cost/error increase
      if (relativeDeltaPercent >= rule.failThresholdPercent) {
        decision = RegressionDecision.FAIL;
        severity = rule.severityIfFail;
      } else if (relativeDeltaPercent >= rule.warnThresholdPercent) {
        decision = RegressionDecision.WARN;
        severity = rule.severityIfWarn;
      }
    }

    // Statistical significance checking if samples are supplied
    let isStatisticallySignificant: boolean | undefined;
    let confidenceInterval: [number, number] | undefined;

    if (
      rawBaselineSamples &&
      rawCandidateSamples &&
      rawBaselineSamples.length >= (rule.minSampleSize || 3) &&
      rawCandidateSamples.length >= (rule.minSampleSize || 3)
    ) {
      const sigTest = calculateStatisticalSignificance(
        rawBaselineSamples,
        rawCandidateSamples,
      );
      isStatisticallySignificant = sigTest.isSignificant;

      const candCi = calculateConfidenceInterval(rawCandidateSamples, 0.95);
      confidenceInterval = [candCi.lower, candCi.upper];

      // If sample sizes are small or change is statistically insignificant random noise, downgrade FAIL to WARN unless critical
      if (!isStatisticallySignificant && decision === RegressionDecision.FAIL && severity !== RegressionSeverity.CRITICAL) {
        decision = RegressionDecision.WARN;
      }
    }

    const explanation = this.buildExplanation(
      metricName,
      baselineVal,
      candidateVal,
      delta,
      relativeDeltaPercent,
      decision,
      rule,
      candidateSummary.unit,
    );

    return {
      metricName,
      category: rule.category,
      regressionType: rule.regressionType,
      direction: rule.direction,
      baselineValue: baselineVal,
      candidateValue: candidateVal,
      delta,
      relativeDelta: Math.round(relativeDelta * 10000) / 10000,
      relativeDeltaPercent,
      warnThresholdPercent: rule.warnThresholdPercent,
      failThresholdPercent: rule.failThresholdPercent,
      decision,
      severity,
      isStatisticallySignificant,
      confidenceInterval,
      explanation,
      unit: candidateSummary.unit,
    };
  }

  public compareRuns(
    baselineMetrics: Record<string, MetricSummary>,
    candidateMetrics: Record<string, MetricSummary>,
    options?: CompareOptions,
  ): RegressionSummary {
    if (options?.policy) {
      this.policyEngine = new PolicyEngine(options.policy);
    }

    const regressions: MetricRegression[] = [];
    let passedCount = 0;
    let warnCount = 0;
    let failedCount = 0;

    for (const [metricName, candidateSummary] of Object.entries(candidateMetrics)) {
      const baselineSummary = baselineMetrics[metricName];
      if (!baselineSummary) {
        continue;
      }

      const baselineSamples = options?.rawSampleData?.baselineSamples?.[metricName];
      const candidateSamples = options?.rawSampleData?.candidateSamples?.[metricName];

      const regression = this.compareMetric(
        metricName,
        baselineSummary,
        candidateSummary,
        undefined,
        baselineSamples,
        candidateSamples,
      );

      regressions.push(regression);

      if (regression.decision === RegressionDecision.FAIL) {
        failedCount++;
      } else if (regression.decision === RegressionDecision.WARN) {
        warnCount++;
      } else {
        passedCount++;
      }
    }

    let overallDecision = RegressionDecision.PASS;
    if (failedCount > 0) {
      overallDecision = RegressionDecision.FAIL;
    } else if (warnCount > 0) {
      overallDecision = RegressionDecision.WARN;
    }

    // Sort regressions with FAIL first, then WARN, then biggest relative deviations
    const sortedRegressions = [...regressions].sort((a, b) => {
      const order = { [RegressionDecision.FAIL]: 0, [RegressionDecision.WARN]: 1, [RegressionDecision.PASS]: 2 };
      if (order[a.decision] !== order[b.decision]) {
        return order[a.decision] - order[b.decision];
      }
      return Math.abs(b.relativeDeltaPercent) - Math.abs(a.relativeDeltaPercent);
    });

    const topRegressions = sortedRegressions.filter(r => r.decision !== RegressionDecision.PASS);

    return {
      overallDecision,
      totalMetricsCompared: regressions.length,
      passedCount,
      warnCount,
      failedCount,
      regressions: sortedRegressions,
      topRegressions,
      evaluatedAt: new Date().toISOString(),
      policyUsed: options?.policy?.name || DEFAULT_REGRESSION_POLICY.name,
    };
  }

  private buildExplanation(
    metricName: string,
    baseline: number,
    candidate: number,
    delta: number,
    relativePercent: number,
    decision: RegressionDecision,
    rule: RegressionPolicyRule,
    unit: string,
  ): string {
    const sign = delta > 0 ? '+' : '';
    const pctSign = relativePercent > 0 ? '+' : '';
    const formattedBaseline = Number(baseline).toLocaleString(undefined, { maximumFractionDigits: 4 });
    const formattedCandidate = Number(candidate).toLocaleString(undefined, { maximumFractionDigits: 4 });

    if (decision === RegressionDecision.PASS) {
      return `${metricName} passed: Candidate (${formattedCandidate} ${unit}) vs Baseline (${formattedBaseline} ${unit}), delta: ${sign}${delta} (${pctSign}${relativePercent}%). Within safe thresholds.`;
    }

    const directionNote =
      rule.direction === MetricDirection.HIGHER_IS_BETTER
        ? `Quality drop of ${relativePercent}% exceeded ${decision === RegressionDecision.FAIL ? 'FAIL' : 'WARN'} threshold (${decision === RegressionDecision.FAIL ? rule.failThresholdPercent : rule.warnThresholdPercent}%)`
        : `Performance/Cost increase of +${relativePercent}% exceeded ${decision === RegressionDecision.FAIL ? 'FAIL' : 'WARN'} threshold (+${decision === RegressionDecision.FAIL ? rule.failThresholdPercent : rule.warnThresholdPercent}%)`;

    return `${decision} regression on ${metricName}: ${directionNote}. Baseline: ${formattedBaseline} ${unit}, Candidate: ${formattedCandidate} ${unit} (Change: ${sign}${delta} ${unit}, ${pctSign}${relativePercent}%).`;
  }
}
