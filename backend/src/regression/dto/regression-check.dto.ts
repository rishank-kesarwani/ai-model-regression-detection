import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class RegressionCheckDto {
  @ApiProperty({ example: 'ai-pr-review-platform' })
  @IsString()
  @IsNotEmpty()
  project: string;

  @ApiProperty({ example: '2.4.1', required: false })
  @IsString()
  @IsOptional()
  version?: string;

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

  @ApiProperty({ example: '1.2.0', required: false })
  @IsString()
  @IsOptional()
  promptVersion?: string;

  @ApiProperty({ example: 'baseline_run_id_or_active', required: false })
  @IsString()
  @IsOptional()
  baselineId?: string;

  @ApiProperty({ example: ['exact_match', 'string_similarity', 'latency_ms', 'estimated_cost_usd', 'ai_judge_score'], required: false })
  @IsArray()
  @IsOptional()
  metrics?: string[];

  @ApiProperty({ example: 'policy_id', required: false })
  @IsString()
  @IsOptional()
  policyId?: string;
}

export class RegressionCheckResponseDto {
  @ApiProperty({ example: 'PASS' })
  status: 'PASS' | 'WARN' | 'FAIL';

  @ApiProperty({ example: '66f00123...run_id' })
  runId: string;

  @ApiProperty({
    example: {
      passed: 8,
      warnings: 1,
      failed: 0,
    },
  })
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };

  @ApiProperty({ type: [Object], example: [] })
  regressions: any[];
}
