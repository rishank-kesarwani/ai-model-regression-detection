import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional, IsObject } from 'class-validator';

export class CreatePromptDto {
  @ApiProperty({ example: 'Summarization System Prompt' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'summarize-prompt' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'default', required: false })
  @IsString()
  @IsOptional()
  project?: string;

  @ApiProperty({ example: 'You are an expert technical editor. Summarize: {{input}}' })
  @IsString()
  @IsNotEmpty()
  initialTemplate: string;

  @ApiProperty({ example: 'You are an AI assistant specialized in concise executive summaries.', required: false })
  @IsString()
  @IsOptional()
  initialSystemTemplate?: string;

  @ApiProperty({ example: 'Prompt used for multi-document technical summarization', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['summarize', 'v1'], required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class CreatePromptVersionDto {
  @ApiProperty({ example: '1.1.0' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ example: 'You are a staff engineer. Provide high-density summaries: {{input}}' })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  systemTemplate?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
