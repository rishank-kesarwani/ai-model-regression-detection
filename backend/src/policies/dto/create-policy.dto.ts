import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty({ example: 'Strict Production Policy' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'default', required: false })
  @IsString()
  @IsOptional()
  project?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ example: 'Stricter 1% accuracy drop threshold for production candidate releases', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  rules: any[];
}
