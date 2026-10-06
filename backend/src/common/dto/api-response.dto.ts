import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message?: string;

  @ApiProperty()
  data?: T;

  @ApiProperty({ required: false })
  error?: {
    code: string;
    details?: any;
  };

  @ApiProperty({ example: '2026-10-06T00:00:00.000Z' })
  timestamp: string;

  constructor(success: boolean, data?: T, message?: string, error?: any) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static ok<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message);
  }

  static fail(message: string, code: string = 'ERROR', details?: any): ApiResponseDto {
    return new ApiResponseDto(false, undefined, message, { code, details });
  }
}
