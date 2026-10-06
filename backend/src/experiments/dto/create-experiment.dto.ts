import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class ExperimentVariantConfigDto {
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

  @ApiProperty({ example: '1.0.0', required: false })
  @IsString()
  @IsOptional()
  applicationVersion?: string;
}

export class CreateExperimentDto {
  @ApiProperty({ example: 'GPT-4o vs Claude-3.5-Sonnet Summarization' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'default', required: false })
  @IsString()
  @IsOptional()
  project?: string;

  @ApiProperty({ example: 'customer-support-v1' })
  @IsString()
  @IsNotEmpty()
  datasetId: string;

  @ApiProperty({ example: '1.0.0', required: false })
  @IsString()
  @IsOptional()
  datasetVersion?: string;

  @ApiProperty({ type: ExperimentVariantConfigDto })
  @IsObject()
  @IsNotEmpty()
  controlConfig: ExperimentVariantConfigDto;

  @ApiProperty({ type: ExperimentVariantConfigDto })
  @IsObject()
  @IsNotEmpty()
  candidateConfig: ExperimentVariantConfigDto;

  @ApiProperty({ example: 'Evaluating performance and cost trade-offs', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
