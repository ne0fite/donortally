import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class LoginDto {
  email: string;
  password: string;
}

class ActivateInviteDto {
  token: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Logged out' };
  }

  @Get('invite/validate')
  validateInvite(@Query('token') token: string) {
    return this.authService.validateInviteToken(token);
  }

  @Post('invite/activate')
  @HttpCode(HttpStatus.OK)
  activateInvite(@Body() dto: ActivateInviteDto) {
    return this.authService.activateInvite(dto.token, dto.password);
  }
}
