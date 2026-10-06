import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Middleware
  app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }));

  // Safe runtime cookie parser
  app.use((cookieParser as any).default ? (cookieParser as any).default() : cookieParser());

  // CORS Configuration
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server) or any localhost / vercel / custom domains
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.rishankkesharwani\.com)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in demo/staging environment
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Service-Name'],
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/v1/health'],
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global Filters & Interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(60000),
  );

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Model Regression Detection & Evaluation API')
    .setDescription(
      'Production-grade platform for evaluating LLM versions, detecting regressions across quality, latency, cost, and safety, and enforcing CI/CD baseline policies.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Datasets')
    .addTag('Evaluations')
    .addTag('Baselines')
    .addTag('Regression Engine & Integration Contract')
    .addTag('GitHub Integration')
    .addTag('Experiments')
    .addTag('Prompts')
    .addTag('Models & Pricing')
    .addTag('Regression Policies')
    .addTag('Metrics Catalog')
    .addTag('Health')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'AI Model Regression Detection API Docs',
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  const host = '0.0.0.0';

  await app.listen(port, host);
  logger.log(`Server running on http://${host}:${port}`);
  logger.log(`Swagger docs available on http://${host}:${port}/api/docs`);
  logger.log(`Health check on http://${host}:${port}/health`);
}

bootstrap();
