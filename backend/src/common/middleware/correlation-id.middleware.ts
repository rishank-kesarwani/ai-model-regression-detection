import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      service?: {
        name: string;
        authenticated: boolean;
      };
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerCorrelationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string);

    const correlationId =
      headerCorrelationId && headerCorrelationId.trim().length > 0
        ? headerCorrelationId.trim()
        : crypto.randomUUID();

    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}
