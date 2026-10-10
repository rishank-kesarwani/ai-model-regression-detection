import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PassportStrategy, AuthGuard } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import {
  REQUIRE_SERVICE_AUTH_KEY,
  REQUIRE_OPERATOR_KEY,
  REQUIRE_USER_KEY,
  PUBLIC_READ_ONLY_KEY,
  ServiceAuthOptions,
} from './decorators/auth-policy.decorator';
import { ServiceApiKeyRegistry } from './service-api-key.registry';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.access_token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret', 'default-jwt-secret'),
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles || ['user'],
    };
  }
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly serviceApiKeyRegistry: ServiceApiKeyRegistry,
    private readonly jwtService: JwtService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const correlationId =
      request.correlationId ||
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      'unknown';

    // 1. Check for Service-to-Service Requirement (PUBLIC DECORATOR MUST NEVER BYPASS)
    const serviceAuthOptions = this.reflector.getAllAndOverride<ServiceAuthOptions>(
      REQUIRE_SERVICE_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (serviceAuthOptions) {
      return this.handleServiceAuth(context, serviceAuthOptions, correlationId);
    }

    // 2. Extract potential Service API Key from headers for general endpoints
    const serviceAuthenticated = this.tryAuthenticateServiceKey(request);

    // 3. Check for Privileged Operator Requirement
    const isOperatorRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_OPERATOR_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isOperatorRequired) {
      return this.handleOperatorAuth(context, serviceAuthenticated, correlationId);
    }

    // 4. Check for Explicit User Requirement
    const isUserRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_USER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isUserRequired) {
      if (serviceAuthenticated) return true;
      return (await super.canActivate(context)) as boolean;
    }

    // 5. Explicit Public Endpoints (Health, Auth Login/Refresh/Logout)
    // These ALWAYS allow unauthenticated access regardless of PUBLIC_ACCESS_ENABLED
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      if (serviceAuthenticated) return true;
      return true;
    }

    // 6. Public Read-Only Demo Endpoints (GET /evaluations, GET /baselines, etc.)
    // Allowed anonymously ONLY IF PUBLIC_ACCESS_ENABLED is true!
    const isPublicReadOnly = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_READ_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    const publicAccessEnabled = this.configService.get<boolean>('publicAccessEnabled', true);

    if (isPublicReadOnly && publicAccessEnabled) {
      // If service already authenticated via key, allow
      if (serviceAuthenticated) {
        return true;
      }

      // If bearer JWT exists, try populating user
      const authHeader = request.headers['authorization'];
      const cookieToken = request.cookies?.access_token;
      if (authHeader || cookieToken) {
        try {
          return (await super.canActivate(context)) as boolean;
        } catch {
          // Fall through to anonymous demo
        }
      }

      // Populate anonymous user context
      request.user = {
        userId: 'anonymous',
        username: 'Anonymous User',
        roles: ['anonymous'],
      };
      return true;
    }

    // 7. Otherwise: Either publicAccessEnabled is false, or the route is not @Public / @PublicReadOnly.
    // Full user authentication (or service authentication) is strictly required!
    if (serviceAuthenticated) return true;
    return (await super.canActivate(context)) as boolean;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isOperatorRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_OPERATOR_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isUserRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_USER_KEY,
      [context.getHandler(), context.getClass()],
    );
    const serviceAuthOptions = this.reflector.getAllAndOverride<ServiceAuthOptions>(
      REQUIRE_SERVICE_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isPublicReadOnly = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_READ_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const publicAccessEnabled = this.configService.get<boolean>('publicAccessEnabled', true);

    if (user && (!user.roles || !user.roles.includes('anonymous'))) {
      return user;
    }

    if (!isOperatorRequired && !isUserRequired && !serviceAuthOptions) {
      if (isPublic || (isPublicReadOnly && publicAccessEnabled)) {
        return { userId: 'anonymous', username: 'Anonymous User', roles: ['anonymous'] };
      }
    }

    throw err || new UnauthorizedException('Authentication required');
  }

  /**
   * Enforces service-to-service authentication and project isolation.
   */
  private async handleServiceAuth(
    context: ExecutionContext,
    options: ServiceAuthOptions,
    correlationId: string,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const xApiKey =
      request.headers['x-api-key'] ||
      request.headers['X-API-KEY'] ||
      request.headers['X-Api-Key'];

    const authHeader = request.headers['authorization'];
    let candidateKey: string | undefined;

    if (typeof xApiKey === 'string' && xApiKey.trim()) {
      candidateKey = xApiKey.trim();
    } else if (typeof authHeader === 'string' && authHeader.trim()) {
      const match = authHeader.match(/^(?:Bearer|ApiKey)\s+(.+)$/i);
      if (match && match[1]?.trim()) {
        candidateKey = match[1].trim();
      }
    }

    if (candidateKey) {
      const result = this.serviceApiKeyRegistry.validateKey(candidateKey);
      if (result.isValid && result.serviceName) {
        // Enforce project authorization
        const targetProject = request.body?.project || request.query?.project;
        if (targetProject && !this.serviceApiKeyRegistry.isProjectAllowed(result.serviceName, targetProject)) {
          throw new ForbiddenException({
            message: `Service "${result.serviceName}" is not authorized to access project "${targetProject}".`,
            code: 'FORBIDDEN_PROJECT_SCOPE',
            correlationId,
          });
        }

        request.service = { name: result.serviceName, authenticated: true };
        request.user = {
          userId: `service:${result.serviceName}`,
          username: result.serviceName,
          roles: result.roles || ['service', result.serviceName],
          isService: true,
        };
        return true;
      }
    }

    // Optional user fallback if enabled
    if (options.allowUser) {
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
          // Token invalid, fall through to 401
        }
      }
    }

    throw new UnauthorizedException({
      message: 'Valid service API key required in x-api-key or Authorization header.',
      code: 'UNAUTHORIZED_SERVICE',
      correlationId,
    });
  }

  /**
   * Enforces privileged operator access.
   */
  private async handleOperatorAuth(
    context: ExecutionContext,
    serviceAuthenticated: boolean,
    correlationId: string,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (serviceAuthenticated && request.user) {
      const roles: string[] = request.user.roles || [];
      if (roles.includes('operator') || roles.includes('admin')) {
        return true;
      }
    }

    const authHeader = request.headers['authorization'];
    const cookieToken = request.cookies?.access_token;
    if (!serviceAuthenticated && !authHeader && !cookieToken) {
      throw new UnauthorizedException({
        message: 'Authentication required. Privileged operator access is restricted.',
        code: 'UNAUTHORIZED_OPERATOR',
        correlationId,
      });
    }

    try {
      const canActivateJwt = (await super.canActivate(context)) as boolean;
      if (canActivateJwt && request.user) {
        const roles: string[] = request.user.roles || [];
        if (roles.includes('operator') || roles.includes('admin')) {
          return true;
        }
      }
    } catch {
      // JWT invalid
    }

    throw new ForbiddenException({
      message: 'Privileged operator access required for this administrative operation.',
      code: 'FORBIDDEN_OPERATOR',
      correlationId,
    });
  }

  /**
   * Attempts service API key authentication on general endpoints.
   */
  private tryAuthenticateServiceKey(request: any): boolean {
    const xApiKey =
      request.headers['x-api-key'] ||
      request.headers['X-API-KEY'] ||
      request.headers['X-Api-Key'];

    const authHeader = request.headers['authorization'];
    let candidateKey: string | undefined;

    if (typeof xApiKey === 'string' && xApiKey.trim()) {
      candidateKey = xApiKey.trim();
    } else if (typeof authHeader === 'string' && authHeader.trim()) {
      const match = authHeader.match(/^(?:Bearer|ApiKey)\s+(.+)$/i);
      if (match && match[1]?.trim()) {
        candidateKey = match[1].trim();
      }
    }

    if (!candidateKey) return false;

    const result = this.serviceApiKeyRegistry.validateKey(candidateKey);
    if (result.isValid && result.serviceName) {
      request.service = { name: result.serviceName, authenticated: true };
      request.user = {
        userId: `service:${result.serviceName}`,
        username: result.serviceName,
        roles: result.roles || ['service', result.serviceName],
        isService: true,
      };
      return true;
    }

    return false;
  }
}
