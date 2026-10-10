import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy, OptionalJwtAuthGuard } from './jwt.strategy';
import { ServiceApiKeyRegistry } from './service-api-key.registry';
import { ServiceApiKeyGuard } from './guards/service-api-key.guard';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret', 'default-jwt-secret'),
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn', '15m')) as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OptionalJwtAuthGuard,
    ServiceApiKeyRegistry,
    ServiceApiKeyGuard,
  ],
  exports: [
    AuthService,
    JwtStrategy,
    OptionalJwtAuthGuard,
    ServiceApiKeyRegistry,
    ServiceApiKeyGuard,
    JwtModule,
  ],
})
export class AuthModule {}
