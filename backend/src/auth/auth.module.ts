import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy, OptionalJwtAuthGuard } from './jwt.strategy';

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
  providers: [AuthService, JwtStrategy, OptionalJwtAuthGuard],
  exports: [AuthService, JwtStrategy, OptionalJwtAuthGuard, JwtModule],
})
export class AuthModule {}
