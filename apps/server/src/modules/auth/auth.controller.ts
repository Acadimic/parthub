import { Controller, Post } from '@nestjs/common';
import { Public } from '@decorators';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register() {
    return this.authService.register();
  }
}
