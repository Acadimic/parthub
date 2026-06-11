import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':subdomain/initial-login-data')
  async getInitialLoginData(@Param('subdomain') subdomain: string) {
    return this.userService.getInitialLoginData(subdomain);
  }
}
