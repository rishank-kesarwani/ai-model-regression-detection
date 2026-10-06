import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class GitHubEvaluationDto {
  @ApiProperty({ example: 'rishank-kesarwani/ai-pr-review-platform' })
  @IsString()
  @IsNotEmpty()
  repository: string;

  @ApiProperty({ example: 42 })
  @IsNumber()
  pullRequest: number;

  @ApiProperty({ example: 'f8d3c7b2e1a90847261530948572819203948571' })
  @IsString()
  @IsNotEmpty()
  commitSha: string;

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

  @ApiProperty({ example: '1.0.0', required: false })
  @IsString()
  @IsOptional()
  promptVersion?: string;

  @ApiProperty({ example: 'baseline_run_id', required: false })
  @IsString()
  @IsOptional()
  baselineRunId?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  metrics?: string[];
}
