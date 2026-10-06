import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint for Render/Kubernetes' })
  checkHealth() {
    return {
      status: 'ok',
      service: 'ai-model-regression-detection',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Public()
  @Get('api/v1/health')
  @ApiOperation({ summary: 'API v1 health check endpoint' })
  checkApiHealth() {
    return this.checkHealth();
  }
}
