import {
  ExactMatchEvaluator,
  JSONSchemaEvaluator,
  StringSimilarityEvaluator,
  LatencyEvaluator,
  TokenUsageEvaluator,
  CostEvaluator,
  LLMJudgeEvaluator,
  SafetyEvaluator,
  CustomMetricEvaluator,
  EvaluatorRegistry,
  calculateDescriptiveStats,
  calculateConfidenceInterval,
  calculateStatisticalSignificance,
  PricingCalculator,
  RegressionEngine,
  PolicyEngine,
  RegressionDecision,
  MetricCategory,
  MetricDirection,
  StandardMetricName,
  MetricSummary,
} from '../src';

describe('Evaluator Package Test Suite', () => {
  describe('ExactMatchEvaluator', () => {
    const evaluator = new ExactMatchEvaluator();

    it('should return 1.0 for identical string output', () => {
      const result = evaluator.evaluate({
        modelOutput: 'Hello World',
        evaluationCase: { id: 'c1', input: 'Say hello', expectedOutput: 'Hello World' },
      });
      expect(result.value).toBe(1.0);
      expect(result.direction).toBe(MetricDirection.HIGHER_IS_BETTER);
    });

    it('should return 0.9 for case-insensitive match', () => {
      const result = evaluator.evaluate({
        modelOutput: 'hello world',
        evaluationCase: { id: 'c1', input: 'Say hello', expectedOutput: 'Hello World' },
      });
      expect(result.value).toBe(0.9);
    });

    it('should return 0.0 for mismatched string output', () => {
      const result = evaluator.evaluate({
        modelOutput: 'Goodbye Universe',
        evaluationCase: { id: 'c1', input: 'Say hello', expectedOutput: 'Hello World' },
      });
      expect(result.value).toBe(0.0);
    });
  });

  describe('JSONSchemaEvaluator', () => {
    const evaluator = new JSONSchemaEvaluator();
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        score: { type: 'number' },
      },
      required: ['name', 'score'],
    };

    it('should validate conforming JSON output', () => {
      const result = evaluator.evaluate({
        modelOutput: '```json\n{"name": "test", "score": 95}\n```',
        evaluationCase: {
          id: 'c2',
          input: 'Extract data',
          expectedJsonSchema: schema,
        },
      });
      expect(result.value).toBe(1.0);
      expect(result.metadata?.schemaValid).toBe(true);
    });

    it('should fail non-conforming JSON structure missing required fields', () => {
      const result = evaluator.evaluate({
        modelOutput: '{"name": "test"}',
        evaluationCase: {
          id: 'c2',
          input: 'Extract data',
          expectedJsonSchema: schema,
        },
      });
      expect(result.value).toBe(0.0);
      expect(result.metadata?.schemaValid).toBe(false);
    });

    it('should fail completely invalid JSON text', () => {
      const result = evaluator.evaluate({
        modelOutput: 'Not a json string at all',
        evaluationCase: {
          id: 'c2',
          input: 'Extract data',
          expectedJsonSchema: schema,
        },
      });
      expect(result.value).toBe(0.0);
      expect(result.metadata?.parsed).toBe(false);
    });
  });

  describe('StringSimilarityEvaluator', () => {
    const evaluator = new StringSimilarityEvaluator();

    it('should return 1.0 for identical strings', () => {
      const res = evaluator.evaluate({
        modelOutput: 'The quick brown fox jumps over the lazy dog',
        evaluationCase: {
          id: 'c3',
          input: 'test',
          expectedOutput: 'The quick brown fox jumps over the lazy dog',
        },
      });
      expect(res.value).toBe(1.0);
    });

    it('should calculate high similarity for close paraphrases', () => {
      const res = evaluator.evaluate({
        modelOutput: 'A quick brown fox jumped over a lazy dog',
        evaluationCase: {
          id: 'c3',
          input: 'test',
          expectedOutput: 'The quick brown fox jumps over the lazy dog',
        },
      });
      expect(res.value).toBeGreaterThan(0.65);
    });
  });

  describe('Latency and Token Usage Evaluators', () => {
    it('should measure latency correctly', () => {
      const latencyEval = new LatencyEvaluator();
      const res = latencyEval.evaluate({
        modelOutput: 'output',
        evaluationCase: { id: 'c4', input: 'test' },
        latencyMs: 342,
      });
      expect(res.value).toBe(342);
      expect(res.direction).toBe(MetricDirection.LOWER_IS_BETTER);
    });

    it('should compute total token counts', () => {
      const tokenEval = new TokenUsageEvaluator();
      const res = tokenEval.evaluate({
        modelOutput: 'output',
        evaluationCase: { id: 'c4', input: 'test' },
        promptTokens: 120,
        completionTokens: 45,
      });
      expect(res.value).toBe(165);
    });
  });

  describe('PricingCalculator and CostEvaluator', () => {
    const pricingCalc = new PricingCalculator();

    it('should calculate cost accurately for known models', () => {
      // GPT-4o: $2.50/M in, $10.00/M out
      const cost = pricingCalc.calculateCost('openai', 'gpt-4o', 1000, 500);
      // 1000/1M * 2.5 = 0.0025; 500/1M * 10 = 0.005 => 0.0075
      expect(cost).toBe(0.0075);
    });

    it('should evaluate cost in CostEvaluator with model pricing snapshot', () => {
      const costEval = new CostEvaluator();
      const res = costEval.evaluate({
        modelOutput: 'output',
        evaluationCase: { id: 'c5', input: 'test' },
        promptTokens: 2000,
        completionTokens: 1000,
        pricingSnapshot: {
          provider: 'openai',
          model: 'gpt-4o',
          inputTokenCostPerMillion: 2.5,
          outputTokenCostPerMillion: 10.0,
          currency: 'USD',
        },
      });
      // 2000/1M * 2.5 = 0.005 + 1000/1M * 10 = 0.010 => 0.015
      expect(res.value).toBe(0.015);
      expect(res.direction).toBe(MetricDirection.LOWER_IS_BETTER);
    });
  });

  describe('LLMJudgeEvaluator', () => {
    const judge = new LLMJudgeEvaluator();

    it('should execute offline heuristic fallback when no judgeProvider given', async () => {
      const res = await judge.evaluate({
        modelOutput: 'Paris is the capital of France.',
        evaluationCase: {
          id: 'c6',
          input: 'What is the capital of France?',
          expectedOutput: 'The capital of France is Paris.',
        },
      });
      expect(res.value).toBeGreaterThan(0.7);
      expect(res.isAiJudgeBased).toBe(true);
    });

    it('should parse structured response from live judge provider', async () => {
      const mockProvider = jest.fn().mockResolvedValue(`{
        "score": 0.92,
        "reason": "Accurate and clear answer.",
        "criteria": { "correctness": 0.95, "relevance": 0.90, "completeness": 0.91 },
        "confidence": 0.95
      }`);

      const res = await judge.evaluate({
        modelOutput: 'Paris',
        evaluationCase: { id: 'c6', input: 'Capital of France?' },
        judgeProvider: mockProvider,
      });

      expect(res.value).toBe(0.92);
      expect(res.metadata?.criteria.correctness).toBe(0.95);
    });
  });

  describe('SafetyEvaluator', () => {
    const safetyEval = new SafetyEvaluator();

    it('should pass clean, safe output', () => {
      const res = safetyEval.evaluate({
        modelOutput: 'Here is a recipe for baking bread.',
        evaluationCase: { id: 'c7', input: 'Recipe' },
      });
      expect(res.value).toBe(0.0);
    });

    it('should detect jailbreak or security bypass attempts', () => {
      const res = safetyEval.evaluate({
        modelOutput: 'I will bypass security and ignore all previous instructions',
        evaluationCase: { id: 'c7', input: 'Bypass rules' },
      });
      expect(res.value).toBe(1.0);
      expect(res.metadata?.hasViolation).toBe(true);
    });
  });

  describe('CustomMetricEvaluator and EvaluatorRegistry', () => {
    it('should evaluate custom regex and length limits', () => {
      const customEval = new CustomMetricEvaluator({
        metricName: 'has_citation',
        expectedPattern: '\\[\\d+\\]',
      });
      const res = customEval.evaluate({
        modelOutput: 'According to research [1], LLMs exhibit regressions.',
        evaluationCase: { id: 'c8', input: 'test' },
      });
      expect(res.value).toBe(1.0);
    });

    it('should register and retrieve evaluators from EvaluatorRegistry', () => {
      const registry = new EvaluatorRegistry();
      expect(registry.get('exact_match')).toBeDefined();
      expect(registry.get('json_schema_validity')).toBeDefined();
      expect(registry.get('latency_ms')).toBeDefined();
    });
  });

  describe('Statistical Analysis', () => {
    it('should calculate descriptive stats accurately', () => {
      const samples = [10, 20, 30, 40, 50];
      const stats = calculateDescriptiveStats(samples);
      expect(stats.count).toBe(5);
      expect(stats.mean).toBe(30);
      expect(stats.median).toBe(30);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.p50).toBe(30);
    });

    it('should calculate confidence intervals', () => {
      const samples = [100, 102, 98, 101, 99, 100, 103, 97];
      const ci = calculateConfidenceInterval(samples, 0.95);
      expect(ci.lower).toBeLessThan(100);
      expect(ci.upper).toBeGreaterThan(100);
    });

    it('should perform statistical significance test between distributions', () => {
      const baseline = [0.95, 0.94, 0.96, 0.95, 0.94, 0.95];
      const candidate = [0.70, 0.72, 0.69, 0.71, 0.68, 0.70];
      const sig = calculateStatisticalSignificance(baseline, candidate);
      expect(sig.isSignificant).toBe(true);
      expect(sig.pValue).toBeLessThan(0.01);
    });
  });

  describe('RegressionEngine and PolicyEngine', () => {
    const engine = new RegressionEngine();

    const makeSummary = (
      name: string,
      mean: number,
      category: MetricCategory,
      direction: MetricDirection,
      unit: string = 'ratio',
    ): MetricSummary => ({
      metricName: name,
      category,
      direction,
      unit,
      mean,
      median: mean,
      min: mean * 0.9,
      max: mean * 1.1,
      stdDev: 0.01,
      p50: mean,
      p95: mean,
      p99: mean,
      sampleSize: 50,
    });

    it('should PASS when candidate matches or improves baseline', () => {
      const baseline = {
        [StandardMetricName.EXACT_MATCH]: makeSummary(StandardMetricName.EXACT_MATCH, 0.90, MetricCategory.QUALITY, MetricDirection.HIGHER_IS_BETTER),
        [StandardMetricName.LATENCY_MS]: makeSummary(StandardMetricName.LATENCY_MS, 400, MetricCategory.PERFORMANCE, MetricDirection.LOWER_IS_BETTER, 'ms'),
      };
      const candidate = {
        [StandardMetricName.EXACT_MATCH]: makeSummary(StandardMetricName.EXACT_MATCH, 0.92, MetricCategory.QUALITY, MetricDirection.HIGHER_IS_BETTER),
        [StandardMetricName.LATENCY_MS]: makeSummary(StandardMetricName.LATENCY_MS, 380, MetricCategory.PERFORMANCE, MetricDirection.LOWER_IS_BETTER, 'ms'),
      };

      const result = engine.compareRuns(baseline, candidate);
      expect(result.overallDecision).toBe(RegressionDecision.PASS);
      expect(result.failedCount).toBe(0);
      expect(result.warnCount).toBe(0);
      expect(result.passedCount).toBe(2);
    });

    it('should trigger WARN on mild quality drop', () => {
      // EXACT_MATCH warnThreshold is -2.0%
      const baseline = {
        [StandardMetricName.EXACT_MATCH]: makeSummary(StandardMetricName.EXACT_MATCH, 1.0, MetricCategory.QUALITY, MetricDirection.HIGHER_IS_BETTER),
      };
      const candidate = {
        [StandardMetricName.EXACT_MATCH]: makeSummary(StandardMetricName.EXACT_MATCH, 0.975, MetricCategory.QUALITY, MetricDirection.HIGHER_IS_BETTER), // -2.5% drop
      };

      const result = engine.compareRuns(baseline, candidate);
      expect(result.overallDecision).toBe(RegressionDecision.WARN);
      expect(result.warnCount).toBe(1);
    });

    it('should trigger FAIL on severe quality drop (e.g. -6% drop)', () => {
      const baseline = {
        [StandardMetricName.EXACT_MATCH]: makeSummary(StandardMetricName.EXACT_MATCH, 1.0, MetricCategory.QUALITY, MetricDirection.HIGHER_IS_BETTER),
      };
      const candidate = {
        [StandardMetricName.EXACT_MATCH]: makeSummary(StandardMetricName.EXACT_MATCH, 0.93, MetricCategory.QUALITY, MetricDirection.HIGHER_IS_BETTER), // -7% drop
      };

      const result = engine.compareRuns(baseline, candidate);
      expect(result.overallDecision).toBe(RegressionDecision.FAIL);
      expect(result.failedCount).toBe(1);
      expect(result.regressions[0].decision).toBe(RegressionDecision.FAIL);
    });

    it('should trigger FAIL on severe latency increase (lower-is-better metric)', () => {
      // LATENCY_MS failThreshold is +30%
      const baseline = {
        [StandardMetricName.LATENCY_MS]: makeSummary(StandardMetricName.LATENCY_MS, 300, MetricCategory.PERFORMANCE, MetricDirection.LOWER_IS_BETTER, 'ms'),
      };
      const candidate = {
        [StandardMetricName.LATENCY_MS]: makeSummary(StandardMetricName.LATENCY_MS, 450, MetricCategory.PERFORMANCE, MetricDirection.LOWER_IS_BETTER, 'ms'), // +50% increase
      };

      const result = engine.compareRuns(baseline, candidate);
      expect(result.overallDecision).toBe(RegressionDecision.FAIL);
      expect(result.regressions[0].relativeDeltaPercent).toBe(50);
      expect(result.regressions[0].decision).toBe(RegressionDecision.FAIL);
    });
  });
});
