import { BaseMetricEvaluator, EvaluatorContext } from './base.evaluator';
import { MetricCategory, MetricDirection, StandardMetricName, SingleMetricResult } from '../types/metric.types';

export class StringSimilarityEvaluator extends BaseMetricEvaluator {
  readonly metricName = StandardMetricName.STRING_SIMILARITY;
  readonly category = MetricCategory.QUALITY;
  readonly direction = MetricDirection.HIGHER_IS_BETTER;
  readonly unit = 'ratio';

  evaluate(context: EvaluatorContext): SingleMetricResult {
    const expected = String(context.evaluationCase.expectedOutput || '').trim();
    const actual = String(context.modelOutput || '').trim();

    if (!expected && !actual) {
      return this.createResult(1.0, 'Both expected and actual are empty');
    }
    if (!expected || !actual) {
      return this.createResult(0.0, 'One of expected or actual is empty');
    }

    const jaccard = this.calculateJaccardSimilarity(expected, actual);
    const levenshtein = this.calculateLevenshteinSimilarity(expected, actual);
    const compositeScore = 0.5 * jaccard + 0.5 * levenshtein;

    return this.createResult(
      compositeScore,
      `Calculated composite similarity: ${Math.round(compositeScore * 100)}% (Jaccard: ${Math.round(jaccard * 100)}%, Levenshtein: ${Math.round(levenshtein * 100)}%)`,
      {
        jaccardSimilarity: jaccard,
        levenshteinSimilarity: levenshtein,
        compositeScore,
      },
    );
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0),
    );
  }

  private calculateJaccardSimilarity(str1: string, str2: string): number {
    const set1 = this.tokenize(str1);
    const set2 = this.tokenize(str2);

    if (set1.size === 0 && set2.size === 0) return 1.0;
    if (set1.size === 0 || set2.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const item of set1) {
      if (set2.has(item)) {
        intersectionCount++;
      }
    }
    const unionCount = set1.size + set2.size - intersectionCount;
    return unionCount === 0 ? 1.0 : intersectionCount / unionCount;
  }

  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;

    // Optimization for long texts: sample or cap
    if (maxLen > 2000) {
      const s1Slice = s1.slice(0, 1000);
      const s2Slice = s2.slice(0, 1000);
      const distance = this.levenshteinDistance(s1Slice, s2Slice);
      return 1 - distance / Math.max(s1Slice.length, s2Slice.length);
    }

    const distance = this.levenshteinDistance(s1, s2);
    return 1 - distance / maxLen;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    let prevRow = new Array(n + 1);
    let currRow = new Array(n + 1);

    for (let j = 0; j <= n; j++) {
      prevRow[j] = j;
    }

    for (let i = 1; i <= m; i++) {
      currRow[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        currRow[j] = Math.min(
          prevRow[j] + 1, // deletion
          currRow[j - 1] + 1, // insertion
          prevRow[j - 1] + cost, // substitution
        );
      }
      for (let j = 0; j <= n; j++) {
        prevRow[j] = currRow[j];
      }
    }

    return prevRow[n];
  }
}
