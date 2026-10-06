import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty({ example: 'customer-support-v1' })
  @IsString()
  @IsNotEmpty()
  datasetId: string;

  @ApiProperty({ example: '1.0.0', required: false })
  @IsString()
  @IsOptional()
  datasetVersion?: string;

  @ApiProperty({ example: 'gpt-4o' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 'openai', required: false })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({ example: 'default', required: false })
  @IsString()
  @IsOptional()
  project?: string;

  @ApiProperty({ example: '1.0.0', required: false })
  @IsString()
  @IsOptional()
  promptVersion?: string;

  @ApiProperty({ example: '2.4.0', required: false })
  @IsString()
  @IsOptional()
  applicationVersion?: string;

  @ApiProperty({ example: '66f...baseline_id', required: false })
  @IsString()
  @IsOptional()
  baselineRunId?: string;

  @ApiProperty({
    example: ['exact_match', 'string_similarity', 'json_schema_validity', 'latency_ms', 'total_tokens', 'estimated_cost_usd', 'ai_judge_score', 'safety_policy_violation'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  metrics?: string[];

  @ApiProperty({ example: 0.7, required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ example: 1024, required: false })
  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @ApiProperty({ example: 'c3f1b4a', required: false })
  @IsString()
  @IsOptional()
  commitSha?: string;

  @ApiProperty({ example: 42, required: false })
  @IsNumber()
  @IsOptional()
  pullRequest?: number;

  @ApiProperty({ example: 'rishank-kesarwani/ai-pr-review-platform', required: false })
  @IsString()
  @IsOptional()
  repository?: string;

  @ApiProperty({ example: 'policy_id', required: false })
  @IsString()
  @IsOptional()
  policyId?: string;

  @ApiProperty({ example: 'manual', required: false })
  @IsString()
  @IsOptional()
  triggerType?: 'manual' | 'scheduled' | 'api' | 'github_pr' | 'experiment';

  @ApiProperty({ example: false, description: 'Whether to run in async queue mode', required: false })
  @IsBoolean()
  @IsOptional()
  runAsync?: boolean;
}
