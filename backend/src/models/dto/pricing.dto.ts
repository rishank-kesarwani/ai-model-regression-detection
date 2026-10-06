import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateModelPricingDto {
  @ApiProperty({ example: 'openai' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ example: 'gpt-4o' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 2.50, description: 'Cost in USD per 1,000,000 input tokens' })
  @IsNumber()
  @Min(0)
  inputTokenCostPerMillion: number;

  @ApiProperty({ example: 10.00, description: 'Cost in USD per 1,000,000 output tokens' })
  @IsNumber()
  @Min(0)
  outputTokenCostPerMillion: number;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  currency?: string;
}
