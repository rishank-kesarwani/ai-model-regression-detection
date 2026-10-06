export interface EvaluationCase {
  id: string;
  input: string;
  expectedOutput?: string;
  expectedJsonSchema?: Record<string, any>;
  category?: string;
  tags?: string[];
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGING';
  metadata?: Record<string, any>;
  context?: string;
  toolsAvailable?: any[];
  expectedToolCalls?: any[];
}

export interface DatasetMetadata {
  description?: string;
  author?: string;
  domain?: string;
  tags?: string[];
  totalCases: number;
}

export interface DatasetVersion {
  version: string; // e.g. "1.0.0"
  contentHash: string;
  cases: EvaluationCase[];
  createdAt: Date | string;
  isImmutable: boolean;
  metadata?: Record<string, any>;
}

export interface Dataset {
  id: string;
  name: string;
  slug: string;
  project: string;
  latestVersion: string;
  versions: DatasetVersion[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
