import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GitHubService } from './github.service';
import { GitHubController } from './github.controller';
import { WebhookEvent, WebhookEventSchema } from '../schemas/webhook-event.schema';
import { EvaluationsModule } from '../evaluations/evaluations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebhookEvent.name, schema: WebhookEventSchema },
    ]),
    EvaluationsModule,
  ],
  controllers: [GitHubController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
