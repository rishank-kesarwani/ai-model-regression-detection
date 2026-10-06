import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBaselineDto {
  @ApiProperty({ example: 'Production v2.4 Gold Baseline' })
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

  @ApiProperty({ example: '66f00123...run_id' })
  @IsString()
  @IsNotEmpty()
  evaluationRunId: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ example: 'Accepted gold standard for GPT-4o with prompt v1.2', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
