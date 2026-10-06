import { BaseMetricEvaluator, EvaluatorContext } from './base.evaluator';
import { MetricCategory, MetricDirection, StandardMetricName, SingleMetricResult } from '../types/metric.types';
import { LLMJudgeScore } from '../types/judge.types';

export class LLMJudgeEvaluator extends BaseMetricEvaluator {
  readonly metricName = StandardMetricName.AI_JUDGE_SCORE;
  readonly category = MetricCategory.QUALITY;
  readonly direction = MetricDirection.HIGHER_IS_BETTER;
  readonly unit = 'score';
  readonly isAiJudgeBased = true;

  async evaluate(context: EvaluatorContext): Promise<SingleMetricResult> {
    const input = context.evaluationCase.input;
    const expected = context.evaluationCase.expectedOutput;
    const actual = context.modelOutput;

    if (!context.judgeProvider) {
      // Offline fallback: calculate synthetic heuristic judge score
      const heuristicScore = this.calculateHeuristicScore(expected, actual);
      return this.createResult(
        heuristicScore.score,
        heuristicScore.reason,
        {
          criteria: heuristicScore.criteria,
          provider: 'offline-heuristic-fallback',
        },
      );
    }

    const judgePrompt = this.buildJudgePrompt(input, expected, actual, context.customParameters?.rubric);

    try {
      const judgeResponse = await context.judgeProvider(judgePrompt);
      const parsedScore = this.parseJudgeOutput(judgeResponse);

      return this.createResult(
        parsedScore.score,
        parsedScore.reason,
        {
          criteria: parsedScore.criteria,
          confidence: parsedScore.confidence,
          isAiJudgeBased: true,
        },
      );
    } catch (err: any) {
      // Resilient fallback on judge error
      const fallback = this.calculateHeuristicScore(expected, actual);
      return this.createResult(
        fallback.score,
        `AI Judge execution failed (${err.message}); used fallback heuristic`,
        {
          criteria: fallback.criteria,
          error: err.message,
          fallbackUsed: true,
        },
      );
    }
  }

  private buildJudgePrompt(input: string, expected?: string, actual?: string, rubric?: string): string {
    return `You are an expert AI Model Evaluation Judge. Evaluate the quality of the model's actual response against the input and expected response.

User Input:
${input}

Expected Reference Output:
${expected || 'N/A (Open-ended or creative generation)'}

Actual Model Output:
${actual || '(Empty response)'}

Evaluation Rubric:
${rubric || 'Evaluate correctness (0.0 - 1.0), relevance (0.0 - 1.0), and completeness (0.0 - 1.0).'}

You MUST respond strictly with a valid JSON object matching this schema:
{
  "score": number, // Overall quality score from 0.0 to 1.0
  "reason": string, // Detailed reasoning for your score
  "criteria": {
    "correctness": number, // 0.0 to 1.0
    "relevance": number, // 0.0 to 1.0
    "completeness": number // 0.0 to 1.0
  },
  "confidence": number // 0.0 to 1.0
}
DO NOT include any text outside the JSON object.`;
  }

  private parseJudgeOutput(rawOutput: string): LLMJudgeScore {
    let clean = rawOutput.trim();
    const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      clean = codeBlockMatch[1].trim();
    }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(clean);
    const score = typeof data.score === 'number' ? Math.max(0, Math.min(1, data.score)) : 0.5;
    const reason = typeof data.reason === 'string' ? data.reason : 'AI judge evaluation completed';
    const criteria = {
      correctness: typeof data.criteria?.correctness === 'number' ? Math.max(0, Math.min(1, data.criteria.correctness)) : score,
      relevance: typeof data.criteria?.relevance === 'number' ? Math.max(0, Math.min(1, data.criteria.relevance)) : score,
      completeness: typeof data.criteria?.completeness === 'number' ? Math.max(0, Math.min(1, data.criteria.completeness)) : score,
    };

    return {
      score,
      reason,
      criteria,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
    };
  }

  private calculateHeuristicScore(expected?: string, actual?: string): LLMJudgeScore {
    if (!expected) {
      const hasLength = (actual?.length || 0) > 10;
      return {
        score: hasLength ? 0.85 : 0.4,
        reason: hasLength ? 'Non-empty output generated for open prompt' : 'Very short output',
        criteria: { correctness: 0.8, relevance: 0.85, completeness: hasLength ? 0.9 : 0.4 },
      };
    }
    if (!actual) {
      return {
        score: 0.0,
        reason: 'Actual output is empty',
        criteria: { correctness: 0.0, relevance: 0.0, completeness: 0.0 },
      };
    }

    const expectedTokens = new Set(expected.toLowerCase().split(/\s+/));
    const actualTokens = new Set(actual.toLowerCase().split(/\s+/));
    let matchCount = 0;
    for (const t of expectedTokens) {
      if (actualTokens.has(t)) matchCount++;
    }
    const overlap = expectedTokens.size > 0 ? matchCount / expectedTokens.size : 0;
    const score = Math.round(Math.min(1.0, overlap * 1.1) * 100) / 100;

    return {
      score,
      reason: `Heuristic semantic match estimated at ${Math.round(score * 100)}% based on token overlap`,
      criteria: {
        correctness: score,
        relevance: Math.min(1.0, score + 0.05),
        completeness: Math.min(1.0, score),
      },
    };
  }
}
