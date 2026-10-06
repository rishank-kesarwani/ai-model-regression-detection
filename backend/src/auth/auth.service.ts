import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(username: string, pass: string) {
    // For demo/portfolio platform, allow standard admin or valid credentials
    if ((username === 'admin' || username.includes('@')) && pass.length >= 6) {
      const payload = {
        sub: 'user-admin-1',
        username: username,
        roles: ['admin', 'engineer'],
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: (this.configService.get<string>('jwt.expiresIn', '15m')) as any,
      });

      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn', '7d')) as any,
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: payload.sub,
          username: payload.username,
          roles: payload.roles,
        },
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const newPayload = {
        sub: payload.sub,
        username: payload.username,
        roles: payload.roles,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: (this.configService.get<string>('jwt.expiresIn', '15m')) as any,
      });

      return {
        accessToken,
        user: {
          id: newPayload.sub,
          username: newPayload.username,
          roles: newPayload.roles,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
