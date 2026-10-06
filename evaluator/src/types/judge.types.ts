export interface LLMJudgeCriteria {
  correctness: number; // 0.0 - 1.0
  relevance: number; // 0.0 - 1.0
  completeness: number; // 0.0 - 1.0
  conciseness?: number;
  safety?: number;
  [key: string]: number | undefined;
}

export interface LLMJudgeRubric {
  instruction?: string;
  scoringGuidelines?: string;
  criteriaWeights?: Record<string, number>;
  temperature?: number;
}

export interface LLMJudgeScore {
  score: number; // Overall normalized score 0.0 - 1.0
  reason: string;
  criteria: LLMJudgeCriteria;
  confidence?: number;
}

export interface LLMJudgeInput {
  userInput: string;
  expectedOutput?: string;
  actualOutput: string;
  context?: string;
  rubric?: LLMJudgeRubric;
}
