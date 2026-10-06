import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiPlatformService } from './ai-platform.service';
import { NotificationService } from './notification.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AiPlatformService, NotificationService],
  exports: [AiPlatformService, NotificationService],
})
export class IntegrationsModule {}
