import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as any;
        message = obj.message || exception.message;
        code = obj.error || `HTTP_${status}`;
        details = Array.isArray(obj.message) ? obj.message : undefined;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = exception.name || 'UNKNOWN_ERROR';
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    // Mask sensitive details in production
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'An unexpected server error occurred. Please contact support.';
    }

    const correlationId =
      request.correlationId ||
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      'unknown';

    if (correlationId !== 'unknown') {
      response.setHeader('X-Correlation-ID', correlationId);
    }

    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message.join(', ') : message,
      error: {
        code,
        statusCode: status,
        path: request.url,
        correlationId,
        details,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
