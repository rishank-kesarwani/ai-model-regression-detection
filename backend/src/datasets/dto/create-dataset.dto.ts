import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class EvaluationCaseDto {
  @ApiProperty({ example: 'case-1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Explain what a neural network is in 2 sentences.' })
  @IsString()
  @IsNotEmpty()
  input: string;

  @ApiProperty({ example: 'A neural network is an AI model inspired by human brain biology. It learns patterns from data across interconnected node layers.', required: false })
  @IsString()
  @IsOptional()
  expectedOutput?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  expectedJsonSchema?: Record<string, any>;

  @ApiProperty({ example: 'ml-knowledge', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: ['ai', 'qa'], required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: 'MEDIUM', required: false })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateDatasetDto {
  @ApiProperty({ example: 'Customer Support Benchmark' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'customer-support-v1' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'default', required: false })
  @IsString()
  @IsOptional()
  project?: string;

  @ApiProperty({ example: 'Standard customer support intent and resolution evaluation cases.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['support', 'qa', 'prod'], required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ type: [EvaluationCaseDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationCaseDto)
  @IsOptional()
  initialCases?: EvaluationCaseDto[];
}

export class CreateDatasetVersionDto {
  @ApiProperty({ example: '1.1.0' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ type: [EvaluationCaseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationCaseDto)
  cases: EvaluationCaseDto[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
