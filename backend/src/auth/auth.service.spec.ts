import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn().mockReturnValue({ sub: 'user-admin-1', username: 'admin', roles: ['admin'] }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: any) => {
              if (key === 'jwt.secret') return 'test-secret';
              if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should authenticate valid user and issue tokens', async () => {
    const res = await service.login('admin', 'password123');
    expect(res.accessToken).toBe('mock-jwt-token');
    expect(res.refreshToken).toBe('mock-jwt-token');
    expect(res.user.username).toBe('admin');
  });

  it('should reject short passwords', async () => {
    await expect(service.login('admin', '123')).rejects.toThrow(UnauthorizedException);
  });

  it('should refresh valid token', async () => {
    const res = await service.refreshToken('valid-token');
    expect(res.accessToken).toBe('mock-jwt-token');
    expect(res.user.username).toBe('admin');
  });
});
