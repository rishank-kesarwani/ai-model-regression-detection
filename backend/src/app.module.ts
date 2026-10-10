import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { DatasetsModule } from './datasets/datasets.module';
import { PromptsModule } from './prompts/prompts.module';
import { ModelsModule } from './models/models.module';
import { PoliciesModule } from './policies/policies.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { BaselinesModule } from './baselines/baselines.module';
import { RegressionModule } from './regression/regression.module';
import { GitHubModule } from './github/github.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { MetricsModule } from './metrics/metrics.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('mongodbUri');
        return {
          uri,
          serverSelectionTimeoutMS: 5000,
          retryAttempts: 3,
        };
      },
    }),
    HealthModule,
    AuthModule,
    IntegrationsModule,
    DatasetsModule,
    PromptsModule,
    ModelsModule,
    PoliciesModule,
    EvaluationsModule,
    BaselinesModule,
    RegressionModule,
    GitHubModule,
    ExperimentsModule,
    MetricsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
