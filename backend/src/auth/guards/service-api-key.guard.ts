import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ServiceApiKeyRegistry } from '../service-api-key.registry';
import {
  REQUIRE_SERVICE_AUTH_KEY,
  ServiceAuthOptions,
} from '../decorators/auth-policy.decorator';

@Injectable()
export class ServiceApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly serviceApiKeyRegistry: ServiceApiKeyRegistry,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const correlationId =
      request.correlationId ||
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      'unknown';

    const options = this.reflector.getAllAndOverride<ServiceAuthOptions>(
      REQUIRE_SERVICE_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 1. Extract API Key from x-api-key or Authorization header
    const xApiKey =
      request.headers['x-api-key'] ||
      request.headers['X-API-KEY'] ||
      request.headers['X-Api-Key'];

    const authHeader =
      request.headers['authorization'] || request.headers['Authorization'];

    let candidateKey: string | undefined;

    if (typeof xApiKey === 'string' && xApiKey.trim()) {
      candidateKey = xApiKey.trim();
    } else if (typeof authHeader === 'string' && authHeader.trim()) {
      const match = authHeader.match(/^(?:Bearer|ApiKey)\s+(.+)$/i);
      if (match && match[1]?.trim()) {
        candidateKey = match[1].trim();
      }
    }

    // 2. Validate against dynamic ServiceApiKeyRegistry
    if (candidateKey) {
      const result = this.serviceApiKeyRegistry.validateKey(candidateKey);
      if (result.isValid && result.serviceName) {
        // Enforce project scoping if project is in request body/query
        const targetProject = request.body?.project || request.query?.project;
        if (targetProject && !this.serviceApiKeyRegistry.isProjectAllowed(result.serviceName, targetProject)) {
          throw new ForbiddenException({
            message: `Service "${result.serviceName}" is not authorized to access project "${targetProject}".`,
            code: 'FORBIDDEN_PROJECT_SCOPE',
            correlationId,
          });
        }

        request.service = {
          name: result.serviceName,
          authenticated: true,
        };

        request.user = {
          userId: `service:${result.serviceName}`,
          username: result.serviceName,
          roles: result.roles || ['service', result.serviceName],
          isService: true,
        };

        return true;
      }
    }

    // 3. Fallback: Check user JWT if allowUser is enabled
    if (options?.allowUser) {
      const jwtToken =
        (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
          ? authHeader.substring(7).trim()
          : undefined) || request.cookies?.access_token;

      if (jwtToken) {
        try {
          const secret = this.configService.get<string>('jwt.secret', 'default-jwt-secret');
          const payload = this.jwtService.verify(jwtToken, { secret });
          request.user = {
            userId: payload.sub,
            username: payload.username,
            roles: payload.roles || ['user'],
            isService: false,
          };
          return true;
        } catch {
          // Token verification failed, fall through to 401
        }
      }
    }

    // 4. Reject unauthenticated request
    throw new UnauthorizedException({
      message: 'Valid service API key required in x-api-key or Authorization header.',
      code: 'UNAUTHORIZED_SERVICE',
      correlationId,
    });
  }
}
