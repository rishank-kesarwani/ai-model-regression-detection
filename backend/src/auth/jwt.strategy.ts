import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy, AuthGuard } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

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
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const publicAccessEnabled = this.configService.get<boolean>('publicAccessEnabled', true);

    if (isPublic || publicAccessEnabled) {
      // Still attempt to populate user if authorization header exists
      try {
        return super.canActivate(context);
      } catch {
        return true;
      }
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const publicAccessEnabled = this.configService.get<boolean>('publicAccessEnabled', true);

    if (user) return user;
    if (isPublic || publicAccessEnabled) {
      return { userId: 'anonymous', username: 'Anonymous User', roles: ['anonymous'] };
    }
    throw err || new UnauthorizedException('Authentication required');
  }
}
