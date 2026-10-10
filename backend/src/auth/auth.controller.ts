import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { OptionalJwtAuthGuard } from './jwt.strategy';
import { Public } from '../common/decorators/public.decorator';
import { RequireUser } from './decorators/auth-policy.decorator';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with credentials to obtain JWT tokens' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto.username, dto.password);

    // Set secure cookie
    response.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return ApiResponseDto.ok(result, 'Logged in successfully');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token with refresh token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = dto.refreshToken || req.cookies?.refresh_token;
    const result = await this.authService.refreshToken(token);

    response.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return ApiResponseDto.ok(result, 'Token refreshed successfully');
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out and clear session cookies' })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return ApiResponseDto.ok(null, 'Logged out successfully');
  }

  @UseGuards(OptionalJwtAuthGuard)
  @RequireUser()
  @Get('me')
  @ApiOperation({ summary: 'Get current user session info (Requires active session)' })
  async getProfile(@Req() req: any) {
    return ApiResponseDto.ok(req.user, 'Current session retrieved');
  }
}
