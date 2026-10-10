import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { UpdateModelPricingDto } from './dto/pricing.dto';
import { OptionalJwtAuthGuard } from '../auth/jwt.strategy';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { RequireOperator, PublicReadOnly } from '../auth/decorators/auth-policy.decorator';

@ApiTags('Models & Pricing')
@Controller('models')
@UseGuards(OptionalJwtAuthGuard)
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @PublicReadOnly()
  @Get('pricing')
  @ApiOperation({ summary: 'Get all model pricing configurations (Demo read-only access)' })
  async getAllPricing() {
    const list = await this.modelsService.getAllPricing();
    return ApiResponseDto.ok(list, 'Model pricing catalog retrieved');
  }

  @PublicReadOnly()
  @Get('pricing/:provider/:model')
  @ApiOperation({ summary: 'Get pricing for a specific model (Demo read-only access)' })
  async getPricing(
    @Param('provider') provider: string,
    @Param('model') model: string,
  ) {
    const item = await this.modelsService.getPricingForModel(provider, model);
    return ApiResponseDto.ok(item, 'Pricing retrieved');
  }

  @RequireOperator()
  @Post('pricing')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update or add configurable model pricing (Operator required)' })
  async updatePricing(@Body() dto: UpdateModelPricingDto) {
    const saved = await this.modelsService.upsertPricing(dto);
    return ApiResponseDto.ok(saved, 'Model pricing updated');
  }
}
